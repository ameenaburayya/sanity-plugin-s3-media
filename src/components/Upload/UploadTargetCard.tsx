import {AccessDeniedIcon, UploadIcon} from '@sanity/icons'
import {Box, Card, type CardTone, Flex, Inline, Layer, Text, useToast} from '@sanity/ui'
import {uniqBy} from 'lodash'
import {type FC, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {type FileLike, type InputOnSelectFileFunctionProps, type SchemaType,useTranslation} from 'sanity'
import {styled} from 'styled-components'

import type {FileInfo, S3AssetSource, S3FileSchemaType, S3ImageSchemaType} from '../../types'
import {accepts} from '../../utils'
import {UploadDestinationPicker} from './UploadDestinationPicker'
import {UploadFileTarget} from './UploadFileTarget'

type FileEntry = {
  file: File
  schemaType: SchemaType | null
  assetSource: S3AssetSource | null
}

const StyledCard = styled(Card)`
  height: 100%;
`

const Overlay = styled(Layer)`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background-color: var(--card-bg-color);
  opacity: 0.8;
`

const Sticky = styled(Box)`
  position: sticky;
  top: 0;
  bottom: 0;
  margin: auto;
`

const fileMatchesSchema = (
  file: FileLike,
  schemaType: S3FileSchemaType | S3ImageSchemaType,
): boolean => {
  const accept = schemaType.options?.accept

  if (!accept) return true
  return accepts(file, accept)
}

const getFilesAndAssetSources = ({
  files,
  schemaType,
  assetSources,
  directUploads,
  destinationName,
}: {
  files: File[]
  schemaType: S3FileSchemaType | S3ImageSchemaType
  assetSources: S3AssetSource[]
  directUploads: boolean | undefined
  destinationName: string | null
}): FileEntry[] => {
  if (!directUploads) {
    return files.map((file) => ({
      file,
      schemaType: null,
      assetSource: null,
    }))
  }

  const uploadSources = assetSources.filter((s) => Boolean(s.Uploader))

  return files.map((file) => {
    if (!fileMatchesSchema(file, schemaType)) {
      return {file, schemaType: null, assetSource: null}
    }

    const assetSource =
      uploadSources.find((source) => !destinationName || source.name === destinationName) ?? null

    return {
      file,
      schemaType: assetSource ? schemaType : null,
      assetSource,
    }
  })
}

type UploadTargetCardProps = Parameters<typeof Card>['0'] & {
  directUploads: boolean | undefined
  assetSources: S3AssetSource[]
  schemaType: S3FileSchemaType | S3ImageSchemaType
  isReadOnly?: boolean
  onSetHoveringFiles?: (files: FileInfo[]) => void
  onSelectFile?: (
    props: Omit<InputOnSelectFileFunctionProps, 'assetSource'> & {assetSource: S3AssetSource},
  ) => void
  pasteTarget?: HTMLElement
  children?: ReactNode
}

const Root = styled.div`
  position: relative;
`

export const UploadTargetCard: FC<UploadTargetCardProps> = (props) => {
  const {
    schemaType,
    children,
    assetSources,
    isReadOnly,
    pasteTarget,
    onSelectFile,
    onSetHoveringFiles,
    tone: toneFromProps,
    directUploads,
    ...rest
  } = props

  const assetSourcesWithUpload = useMemo(
    () => assetSources.filter((source) => Boolean(source.Uploader)),
    [assetSources],
  )

  const FileTarget = UploadFileTarget(StyledCard)

  const {push: pushToast} = useToast()
  const {t} = useTranslation()

  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [showAssetSourceDestinationPicker, setShowAssetSourceDestinationPicker] = useState(false)
  const [tone, setTone] = useState<CardTone>(
    toneFromProps || (isReadOnly ? 'transparent' : 'default'),
  )

  const assetSourceDestinationName = useRef<string | null>(null)

  const alertRejectedFiles = useCallback(
    (rejected: FileEntry[]) => {
      pushToast({
        closable: true,
        status: 'warning',
        title: t('inputs.array.error.cannot-upload-unable-to-convert', {
          count: rejected.length,
        }),
        description: rejected.map((task, i) => (
          // oxlint-disable-next-line no-array-index-key
          <Flex key={i} gap={2} padding={2}>
            <Box>
              <Text weight="medium">{task.file.name}</Text>
            </Box>
            <Box>
              <Text size={1}>({task.file.type})</Text>
            </Box>
          </Flex>
        )),
      })
    },
    [pushToast, t],
  )

  // This is called after the user has dropped or pasted files and selected an asset source destination (if applicable)
  const handleUploadFiles = useCallback(
    (files: File[]) => {
      const filesAndAssetSources = getFilesAndAssetSources({
        files,
        directUploads,
        schemaType,
        assetSources,
        destinationName: assetSourceDestinationName.current,
      })

      const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null)
      const rejected = filesAndAssetSources.filter((entry) => entry.assetSource === null)

      if (rejected.length > 0) {
        alertRejectedFiles(rejected)
      }

      if (onSelectFile) {
        ready.forEach((entry) => {
          onSelectFile({
            assetSource: entry.assetSource!,
            schemaType: entry.schemaType!,
            file: entry.file,
          })
        })
      }
    },
    [directUploads, schemaType, assetSources, onSelectFile, alertRejectedFiles],
  )

  // This is called when files are dropped or pasted onto the upload target. It may show the asset source destination picker if needed.
  const handleFiles = useCallback(
    (files: File[]) => {
      if (isReadOnly) {
        return
      }

      const filesAndAssetSources = getFilesAndAssetSources({
        files,
        schemaType,
        destinationName: assetSourceDestinationName.current,
        assetSources,
        directUploads,
      })

      const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null)

      if (ready.length === 0) {
        alertRejectedFiles(filesAndAssetSources)
        return
      }

      const uniqueAssetSources = uniqBy(assetSourcesWithUpload, 'name')
      if (uniqueAssetSources.length > 1 && !assetSourceDestinationName.current) {
        setShowAssetSourceDestinationPicker(true)
        setFilesToUpload(files)
        return
      }
      setShowAssetSourceDestinationPicker(false)
      setFilesToUpload([])
      handleUploadFiles(ready.map((entry) => entry.file))
    },
    [
      isReadOnly,
      schemaType,
      assetSources,
      directUploads,
      assetSourcesWithUpload,
      handleUploadFiles,
      alertRejectedFiles,
    ],
  )

  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])

  const handleFilesOver = useCallback(
    (files: FileInfo[]) => {
      if (isReadOnly) {
        return
      }
      setHoveringFiles(files)

      const acceptedFiles = files.filter((file) => fileMatchesSchema(file, schemaType))

      const rejectedFilesCount = files.length - acceptedFiles.length

      if (rejectedFilesCount > 0) {
        setTone('critical')
      } else if (acceptedFiles.length > 0) {
        setTone('primary')
      } else {
        setTone('default')
      }

      if (onSetHoveringFiles) {
        onSetHoveringFiles(files)
      }
    },
    [isReadOnly, onSetHoveringFiles, schemaType],
  )

  const handleFilesOut = useCallback(() => {
    if (isReadOnly) {
      return
    }
    setHoveringFiles([])
    setTone('default')
    if (onSetHoveringFiles) {
      onSetHoveringFiles([])
    }
    setFilesToUpload([])
  }, [isReadOnly, onSetHoveringFiles])

  // Asset sources may be returned for multiple types (file, image), we need to deduplicate them in order to show a unique list
  const assetSourcesWithUploadByName = uniqBy(assetSourcesWithUpload, 'name')

  const handleSetAssetSourceDestination = useCallback(
    (assetSource: S3AssetSource | null) => {
      assetSourceDestinationName.current = assetSource?.name ?? null
      if (filesToUpload.length > 0 && assetSource) {
        handleUploadFiles(filesToUpload)
      }
      setFilesToUpload([])
      setShowAssetSourceDestinationPicker(false)
      assetSourceDestinationName.current = null
    },
    [filesToUpload, handleUploadFiles],
  )

  const handleUploadDestinationPickerClose = useCallback(() => {
    handleFilesOver([])
    setFilesToUpload([])
    setShowAssetSourceDestinationPicker(false)
    assetSourceDestinationName.current = null
  }, [handleFilesOver])

  const uploadDestinationPickerText = t(
    'inputs.files.common.placeholder.select-asset-source-upload-destination',
    {
      context: schemaType.name,
    },
  )

  const acceptedFiles = hoveringFiles.filter((file) => fileMatchesSchema(file, schemaType))

  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

  return (
    <Root>
      {showAssetSourceDestinationPicker && (
        <UploadDestinationPicker
          assetSources={assetSourcesWithUploadByName}
          onSelectAssetSource={handleSetAssetSourceDestination}
          onClose={handleUploadDestinationPickerClose}
          text={uploadDestinationPickerText}
        />
      )}

      <FileTarget
        {...rest}
        tone={toneFromProps || tone}
        onFiles={handleFiles}
        onFilesOver={handleFilesOver}
        onFilesOut={handleFilesOut}
        pasteTarget={pasteTarget}
      >
        {hoveringFiles.length > 0 && (
          <Overlay zOffset={10}>
            <Sticky paddingBottom={3} paddingTop={3}>
              {acceptedFiles.length > 0 ? (
                <>
                  <Inline space={2}>
                    <Text>
                      <UploadIcon />
                    </Text>
                    {t('inputs.files.common.drop-message.drop-to-upload')}
                    <Text />
                  </Inline>

                  {rejectedFilesCount > 0 && (
                    <Box marginTop={4}>
                      <Inline space={2}>
                        <Text muted size={1}>
                          <AccessDeniedIcon />
                        </Text>
                        <Text muted size={1}>
                          {t(
                            'inputs.files.common.drop-message.drop-to-upload.rejected-file-message',
                            {
                              count: rejectedFilesCount,
                            },
                          )}
                        </Text>
                      </Inline>
                    </Box>
                  )}
                </>
              ) : (
                <Inline space={2}>
                  <Text>
                    <AccessDeniedIcon />
                  </Text>
                  <Text>
                    {t('inputs.files.common.drop-message.drop-to-upload.no-accepted-file-message', {
                      count: hoveringFiles.length,
                    })}
                  </Text>
                </Inline>
              )}
            </Sticky>
          </Overlay>
        )}
        {children}
      </FileTarget>
    </Root>
  )
}
