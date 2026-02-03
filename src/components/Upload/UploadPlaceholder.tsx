import {
  AccessDeniedIcon,
  BinaryDocumentIcon,
  ImageIcon,
  ReadOnlyIcon,
  UploadIcon,
} from '@sanity/icons'
import {Flex, Text, useElementSize} from '@sanity/ui'
import {get} from 'lodash'
import {type FC, type ReactNode, useCallback, useMemo, useState} from 'react'
import {type SchemaType} from 'sanity'
import {useTranslation} from 'sanity'
import styled from 'styled-components'

import {FileInputButton} from '../File/FileInputButton'
import {UploadDropDownMenu} from './UploadDropDownMenu'
import {type S3AssetSource, S3AssetType} from '../../types'

interface UploadPlaceholderProps {
  assetSources: S3AssetSource[]
  browse: ReactNode | undefined
  directUploads: boolean | undefined
  onUpload: ((assetSource: S3AssetSource, files: File[]) => void) | undefined
  readOnly: boolean | undefined
  schemaType: SchemaType
  type: S3AssetType
}

const RootFlex = styled(Flex)`
  pointer-events: none;
`

export const UploadPlaceholder: FC<UploadPlaceholderProps> = (props) => {
  const {assetSources, browse, directUploads, onUpload, readOnly, schemaType, type} = props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rect = useElementSize(rootElement)

  // Adjust the layout in narrow containers
  const collapsed = rect?.border && rect.border.width < 440

  const isFileType = type === S3AssetType.FILE

  const {t} = useTranslation()

  const assetSourcesWithUpload = useMemo(() => {
    const result: S3AssetSource[] = assetSources.filter((s) => Boolean(s.Uploader))

    return result
  }, [assetSources])

  const handleSelectFiles = useCallback(
    (assetSource: S3AssetSource, files: File[]) => {
      if (onUpload) {
        onUpload(assetSource, files)
      }
    },
    [onUpload]
  )

  const accept = get(schemaType, 'options.accept', '')

  const uploadButton = useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1:
        return (
          <FileInputButton
            accept={accept}
            disabled={readOnly || directUploads === false}
            icon={UploadIcon}
            mode="bleed"
            onSelect={(files) => {
              if (onUpload) {
                onUpload(assetSourcesWithUpload[0], files)
              }
            }}
            text={t('input.files.common.upload-placeholder.file-input-button.text')}
          />
        )
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={handleSelectFiles}
            readOnly={readOnly}
          />
        )
    }
  }, [accept, assetSourcesWithUpload, directUploads, handleSelectFiles, onUpload, readOnly, t])

  const messageIcon = useMemo(() => {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if (directUploads === false) {
      return <AccessDeniedIcon />
    }

    return isFileType ? <BinaryDocumentIcon /> : <ImageIcon />
  }, [directUploads, isFileType, readOnly])

  const messageText = useMemo(() => {
    if (directUploads === false) {
      return t('inputs.files.common.placeholder.upload-not-supported')
    }

    if (readOnly) {
      return t('inputs.files.common.placeholder.read-only')
    }

    return t('inputs.files.common.placeholder.drag-or-paste-to-upload', {context: type})
  }, [directUploads, readOnly, t, type])

  return assetSourcesWithUpload.length === 0 ? null : (
    <Flex
      align={collapsed ? undefined : 'center'}
      direction={collapsed ? 'column' : 'row'}
      gap={4}
      justify="space-between"
      paddingY={collapsed ? 1 : undefined}
      ref={setRootElement}
    >
      <Flex flex={1}>
        <RootFlex align="center" gap={3} justify="center" paddingLeft={1}>
          <Text muted size={1}>
            {messageIcon}
          </Text>

          <Text size={1} muted>
            {messageText}
          </Text>
        </RootFlex>
      </Flex>

      <Flex align="center" gap={1} justify="center" wrap="wrap">
        {uploadButton}
        {browse}
      </Flex>
    </Flex>
  )
}
