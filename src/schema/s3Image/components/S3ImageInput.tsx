import {Card, Stack, useToast} from '@sanity/ui'
import {type FC, type JSX, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type Subscription} from 'rxjs'
import {
  type AssetFromSource,
  type AssetSourceUploader,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type InputProps,
  MemberField,
  PatchEvent,
  set,
  setIfMissing,
  unset,
  type UploadState,
  useClient,
  useDocumentPreviewStore,
  useTranslation,
} from 'sanity'

import {BrowserButton, UploadPlaceholder, UploadProgress} from '../../../components'
import {UPLOAD_STATUS_KEY} from '../../../constants'
import {useS3MediaContext, useS3MediaOptionsContext} from '../../../contexts'
import {S3AssetType, type S3AssetSource} from '../../../types'
import {
  createInitialUploadPatches,
  isInProgressUpload,
  isS3ImageSource,
  observeImageAsset,
} from '../../../utils'
import type {S3ImageInputProps} from '../types'
import {InvalidImageWarning} from './InvalidImageWarning'
import {S3ImageInputAsset} from './S3ImageInputAsset'
import {S3ImageInputAssetMenu} from './S3ImageInputAssetMenu'
import {S3ImageInputAssetSource} from './S3ImageInputAssetSource'
import {S3ImageInputPreview} from './S3ImageInputPreview'
import {createS3ImageAssetSource} from '../../../lib'

export const S3ImageInput: FC<S3ImageInputProps> = (props) => {
  const {
    id,
    elementProps,
    members,
    onChange,
    path,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview: renderPreviewProp,
    schemaType,
    value,
  } = props

  const sanityClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {push} = useToast()
  const {t} = useTranslation()

  const {s3Client} = useS3MediaContext()
  const {directUploads} = useS3MediaOptionsContext()

  const assetSources = useMemo(
    () => [createS3ImageAssetSource({sanityClient, s3Client, title: 'S3 Image'})],
    [sanityClient, s3Client]
  )

  const documentPreviewStore = useDocumentPreviewStore()

  const observeAsset = useCallback(
    (assetId: string) => observeImageAsset(documentPreviewStore, assetId),
    [documentPreviewStore]
  )

  const [selectedAssetSource, setSelectedAssetSource] = useState<S3AssetSource | null>(null)
  const [isUploading, setIsUploading] = useState(isInProgressUpload(value))
  const [isStale, setIsStale] = useState(false)

  // Get the menu button element in `ImageActionsMenu` so that focus can be restored to
  // it when closing the dialog (see `handleAssetSourceClosed`)
  const [menuButtonElement, setMenuButtonElement] = useState<HTMLButtonElement | null>(null)
  const [isMenuOpen, setMenuOpen] = useState(false)

  const uploadSubscription = useRef<null | Subscription>(null)

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void
    uploader: AssetSourceUploader
  } | null>(null)

  const valueIsArrayElement = useCallback(() => {
    const parentPathSegment = path.slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    return typeof parentPathSegment !== 'string'
  }, [path])

  const clearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(unset(['_upload']))
    }
  }, [onChange, value?._upload])

  const cancelUpload = useCallback(() => {
    if (uploadSubscription.current) {
      uploadSubscription.current.unsubscribe()
      clearUploadStatus()
    }
  }, [clearUploadStatus])

  const handleClearField = useCallback(() => {
    onChange([unset(['asset'])])
  }, [onChange])

  const handleRemoveButtonClick = useCallback(() => {
    const allKeys = Object.keys(value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', '_upload', 'asset'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset', 'media']
      .concat(allKeys.filter((key) => ['_upload'].includes(key)))
      .map((key) => unset([key]))

    onChange(isEmpty && !valueIsArrayElement() ? unset() : removeKeys)
  }, [onChange, value, valueIsArrayElement])

  const handleSelectAssetFromSource = useCallback(
    (assetsFromSource: AssetFromSource[]) => {
      if (!Array.isArray(assetsFromSource) || assetsFromSource.length === 0 || !assetsFromSource) {
        return
      }

      const asset = assetsFromSource.find(
        (assetFromSource) => assetFromSource.kind === 'assetDocumentId' && assetFromSource.value
      )

      if (!asset) {
        return
      }

      onChange([
        setIfMissing({_type: schemaType.name}),
        set({_type: 'reference', _ref: asset.value}, ['asset']),
      ])

      setSelectedAssetSource(null)
      setIsUploading(false) // This function is also called on after a successful upload completion though an asset source, so reset that state here.
    },
    [onChange, schemaType]
  )

  const handleCancelUpload = useCallback(() => {
    cancelUpload()
  }, [cancelUpload])

  const handleClearUploadState = useCallback(() => {
    setIsStale(false)
    clearUploadStatus()
  }, [clearUploadStatus])

  const handleStaleUpload = useCallback(() => {
    setIsStale(true)
  }, [])

  const handleSelectFileToUpload = useCallback(
    (assetSource: S3AssetSource, file: File) => {
      setSelectedAssetSource(assetSource)
      if (assetSource.Uploader) {
        // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
        const run = () => {
          const uploader = new assetSource.Uploader!()
          // Unsubscribe from the previous uploader
          assetSourceUploader?.unsubscribe()
          setAssetSourceUploader({
            unsubscribe: uploader.subscribe((event) => {
              switch (event.type) {
                case 'progress':
                  onChange(
                    PatchEvent.from([
                      set(Math.max(2, event.progress), [UPLOAD_STATUS_KEY, 'progress']),
                      set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
                    ])
                  )
                  break
                case 'error':
                  event.files.forEach((eventFile) => {
                    console.error(eventFile.error)
                  })
                  push({
                    status: 'error',
                    description: t('asset-sources.common.uploader.upload-failed.description'),
                    title: t('asset-sources.common.uploader.upload-failed.title'),
                  })
                  break
                case 'all-complete': {
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
                  setMenuOpen(false)
                  break
                }
                default:
              }
            }),
            uploader,
          })
          setIsUploading(true)
          onChange(PatchEvent.from(createInitialUploadPatches(file)))
          uploader.upload([file], {schemaType, onChange: onChange as (patch: unknown) => void})
        }
        try {
          run()
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          assetSourceUploader?.unsubscribe()
          setSelectedAssetSource(null)
          setAssetSourceUploader(null)
          push({
            status: 'error',
            description: t('asset-sources.common.uploader.upload-failed.description'),
            title: t('asset-sources.common.uploader.upload-failed.title'),
          })
          console.error(err)
        }
      }
    },
    [assetSourceUploader, onChange, push, schemaType, t]
  )

  // Abort asset source uploads and unsubscribe from the uploader is the component unmounts
  useEffect(() => {
    return () => {
      assetSourceUploader?.uploader?.abort()
      assetSourceUploader?.unsubscribe()
    }
  }, [assetSourceUploader])

  const handleSelectImageFromAssetSource = useCallback((source: S3AssetSource) => {
    setSelectedAssetSource(source)
  }, [])

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)

    // Set focus on menu button in `ImageActionsMenu` when closing the dialog
    menuButtonElement?.focus()
  }, [menuButtonElement])

  const renderPreview = useCallback<() => JSX.Element>(() => {
    if (!value) {
      return <></>
    }

    return <S3ImageInputPreview readOnly={readOnly} value={value} />
  }, [readOnly, value])

  const renderAssetMenu = useCallback(() => {
    return (
      <S3ImageInputAssetMenu
        assetSources={assetSources}
        handleRemoveButtonClick={handleRemoveButtonClick}
        onSelectFile={handleSelectFileToUpload}
        handleSelectImageFromAssetSource={handleSelectImageFromAssetSource}
        isMenuOpen={isMenuOpen}
        observeAsset={observeAsset}
        readOnly={readOnly}
        schemaType={schemaType}
        setMenuButtonElement={setMenuButtonElement}
        setMenuOpen={setMenuOpen}
        value={value}
      />
    )
  }, [
    assetSources,
    handleRemoveButtonClick,
    handleSelectFileToUpload,
    handleSelectImageFromAssetSource,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    value,
  ])

  const renderUploadPlaceholder = useCallback(() => {
    return (
      <div style={{padding: 1}}>
        <Card
          tone={readOnly ? 'transparent' : 'inherit'}
          border
          paddingX={3}
          paddingY={2}
          radius={2}
        >
          <UploadPlaceholder
            assetSources={assetSources}
            browse={
              <BrowserButton
                id={id}
                readOnly={readOnly}
                assetSources={assetSources}
                setSelectedAssetSource={setSelectedAssetSource}
              />
            }
            directUploads={directUploads}
            onUpload={(assetSource, files) => handleSelectFileToUpload(assetSource, files[0])}
            schemaType={schemaType}
            readOnly={readOnly}
            type={S3AssetType.IMAGE}
          />
        </Card>
      </div>
    )
  }, [id, assetSources, directUploads, handleSelectFileToUpload, readOnly, schemaType])

  const renderUploadState = useCallback(
    (uploadState: UploadState) => {
      return (
        <UploadProgress
          uploadState={uploadState}
          onCancel={isUploading ? handleCancelUpload : undefined}
          onStale={handleStaleUpload}
        />
      )
    },
    [handleCancelUpload, handleStaleUpload, isUploading]
  )

  const renderAsset = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => {
      if (
        value &&
        typeof value.asset !== 'undefined' &&
        !value?._upload &&
        !isS3ImageSource(value)
      ) {
        return <InvalidImageWarning onClearValue={handleClearField} />
      }

      return (
        <S3ImageInputAsset
          assetSources={assetSources}
          elementProps={elementProps}
          handleClearUploadState={handleClearUploadState}
          inputProps={inputProps}
          isStale={isStale}
          onSelectFile={handleSelectFileToUpload}
          readOnly={readOnly}
          renderAssetMenu={renderAssetMenu}
          renderPreview={renderPreview}
          renderUploadPlaceholder={renderUploadPlaceholder}
          renderUploadState={renderUploadState}
          schemaType={schemaType}
          selectedAssetSource={selectedAssetSource}
          value={value}
        />
      )
    },
    [
      assetSources,
      elementProps,
      handleClearField,
      handleClearUploadState,
      handleSelectFileToUpload,
      isStale,
      readOnly,
      renderAssetMenu,
      renderPreview,
      renderUploadPlaceholder,
      renderUploadState,
      schemaType,
      selectedAssetSource,
      value,
    ]
  )

  const renderAssetSource = useCallback(() => {
    return (
      <S3ImageInputAssetSource
        handleAssetSourceClosed={handleAssetSourceClosed}
        handleSelectAssetFromSource={handleSelectAssetFromSource}
        isUploading={isUploading}
        observeAsset={observeAsset}
        schemaType={schemaType}
        selectedAssetSource={selectedAssetSource}
        value={value}
      />
    )
  }, [
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    value,
  ])

  return (
    <Stack space={5}>
      {members.map((member) => {
        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderInput={member.name === 'asset' ? renderAsset : renderInput}
              renderField={({children}) => children}
              renderItem={renderItem}
              renderPreview={renderPreviewProp}
            />
          )
        }

        return null
      })}

      {selectedAssetSource && renderAssetSource()}
    </Stack>
  )
}
