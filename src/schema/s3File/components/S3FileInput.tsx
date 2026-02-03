import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient, type AssetSourceUploader} from 'sanity'
import {useToast} from '@sanity/ui'
import {type FC, useCallback, useEffect, useMemo, useState} from 'react'
import {
  MemberField,
  PatchEvent,
  set,
  setIfMissing,
  unset,
  useDocumentPreviewStore,
  useTranslation,
  type AssetFromSource,
} from 'sanity'

import {UPLOAD_STATUS_KEY} from '../../../constants'
import type {S3AssetSource} from '../../../types'
import {observeFileAsset, createInitialUploadPatches} from '../../../utils'
import type {S3FileInputProps} from '../types'
import {S3FileAsset as S3FileAssetComponent} from './S3FileAsset'
import {S3FileAssetSource} from './S3FileAssetSource'
import {createS3FileAssetSource} from '../../../lib'
import {useS3MediaContext} from '../../../contexts'

export const S3FileInput: FC<S3FileInputProps> = (props) => {
  const {
    members,
    onChange,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderItem,
    renderPreview,
    schemaType,
    value,
    changed,
    id,
    path,
    elementProps,
  } = props

  const sanityClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {s3Client} = useS3MediaContext()

  const assetSources = useMemo(
    () => [createS3FileAssetSource({sanityClient, s3Client, title: 'S3 File'})],
    [sanityClient, s3Client]
  )

  const documentPreviewStore = useDocumentPreviewStore()

  const observeAsset = useCallback(
    (assetId: string) => observeFileAsset(documentPreviewStore, assetId),
    [documentPreviewStore]
  )

  const {push} = useToast()
  const {t} = useTranslation()

  const [isStale, setIsStale] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedAssetSource, setSelectedAssetSource] = useState<S3AssetSource | null>(null)

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void
    uploader: AssetSourceUploader
  } | null>(null)

  const handleClearField = useCallback(() => {
    onChange([unset(['asset']), unset(['media'])])
  }, [onChange])

  const handleClearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(PatchEvent.from([unset(['_upload'])]))
    }
  }, [onChange, value?._upload])

  const handleStaleUpload = useCallback(() => {
    setIsStale(true)
  }, [])

  const handleSelectAssets = useCallback(
    (assetsFromSource: AssetFromSource[]) => {
      if (assetsFromSource.length === 0) {
        return
      }

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

  const handleSelectFilesToUpload = useCallback(
    (assetSource: S3AssetSource, files: File[]) => {
      if (files.length === 0) {
        return
      }
      setSelectedAssetSource(assetSource)
      if (assetSource.Uploader) {
        const uploader = new assetSource.Uploader()
        // Unsubscribe from the previous uploader
        assetSourceUploader?.unsubscribe()
        try {
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
                  event.files.forEach((file) => {
                    console.error(file.error)
                  })
                  push({
                    status: 'error',
                    description: t('asset-sources.common.uploader.upload-failed.description'),
                    title: t('asset-sources.common.uploader.upload-failed.title'),
                  })
                  break
                case 'all-complete': {
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
                  break
                }
                default:
              }
            }),
            uploader,
          })
          setIsUploading(true)
          onChange(PatchEvent.from(createInitialUploadPatches(files[0])))
          uploader.upload(files, {schemaType, onChange: onChange as (patch: unknown) => void})
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          setSelectedAssetSource(null)
          assetSourceUploader?.unsubscribe()
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

  const handleCancelUpload = useCallback(() => {
    assetSourceUploader?.uploader?.abort()
  }, [assetSourceUploader])

  const renderAsset = useCallback(() => {
    return (
      <S3FileAssetComponent
        path={path}
        observeAsset={observeAsset}
        elementProps={elementProps}
        id={id}
        value={value}
        changed={changed}
        schemaType={schemaType}
        assetSources={assetSources}
        clearField={handleClearField}
        isStale={isStale}
        isUploading={isUploading}
        onCancelUpload={handleCancelUpload}
        onClearUploadStatus={handleClearUploadStatus}
        onSelectFiles={handleSelectFilesToUpload}
        onStale={handleStaleUpload}
        setSelectedAssetSource={setSelectedAssetSource}
      />
    )
  }, [
    handleCancelUpload,
    handleClearField,
    handleClearUploadStatus,
    handleSelectFilesToUpload,
    handleStaleUpload,
    observeAsset,
    schemaType,
    assetSources,
    isStale,
    isUploading,
    value,
    path,
    id,
    changed,
    elementProps,
  ])

  return (
    <>
      {members.map((member) => {
        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderField={({children}) => children}
              renderInlineBlock={renderInlineBlock}
              renderInput={renderAsset}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          )
        }

        return null
      })}

      {selectedAssetSource && (
        <S3FileAssetSource
          value={value}
          schemaType={schemaType}
          isUploading={isUploading}
          observeAsset={observeAsset}
          onSelectAssets={handleSelectAssets}
          selectedAssetSource={selectedAssetSource}
          setSelectedAssetSource={setSelectedAssetSource}
        />
      )}
    </>
  )
}
