import {Box, Card} from '@sanity/ui'
import {type FC, type FocusEvent, useCallback, useMemo} from 'react'
import type {Observable} from 'rxjs'
import {ChangeIndicator} from 'sanity'
import {isS3FileSource, isS3VideoSource} from 'sanity-plugin-s3-media-asset-utils'

import {
  BrowserButton,
  UploadPlaceholder,
  UploadProgress,
  UploadTargetCard,
  UploadWarning,
} from '../../../components'
import {useS3MediaOptionsContext} from '../../../contexts'
import {
  type S3AssetSource,
  S3AssetType,
  type S3FileAsset as S3FileAssetType,
  type S3VideoAsset,
} from '../../../types'
import {type S3FileInputProps} from '../types'
import {InvalidFileWarning} from './InvalidFileWarning'
import {S3FileInputPreview} from './S3FileInputPreview'

const ASSET_FIELD_PATH = ['asset']

type S3FileInputAssetProps = Pick<
  S3FileInputProps,
  'elementProps' | 'changed' | 'readOnly' | 'schemaType' | 'path' | 'value' | 'focused' | 'id'
> & {
  assetSources: S3AssetSource[]
  isStale: boolean
  isUploading: boolean
  onStale: () => void
  clearField: () => void
  observeAsset: (id: string) => Observable<S3FileAssetType | S3VideoAsset>
  onCancelUpload?: () => void
  onClearUploadStatus: () => void
  onSelectFiles: (assetSource: S3AssetSource, files: File[]) => void
  setSelectedAssetSource: (assetSource: S3AssetSource | null) => void
}

export const S3FileInputAsset: FC<S3FileInputAssetProps> = (props) => {
  const {
    id,
    assetSources,
    changed,
    clearField,
    elementProps,
    isStale,
    isUploading,
    onCancelUpload,
    onClearUploadStatus,
    onSelectFiles,
    onStale,
    observeAsset,
    path,
    readOnly,
    schemaType,
    setSelectedAssetSource,
    value,
    focused,
  } = props

  const {directUploads} = useS3MediaOptionsContext()
  const isVideoField = schemaType.name === 's3Video'

  const assetFieldPath = useMemo(() => path.concat(ASSET_FIELD_PATH), [path])

  const handleFileTargetFocus = useCallback(
    (event: FocusEvent) => {
      // We want to handle focus when the file target element *itself* receives
      // focus, not when an interactive child element receives focus. Since React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (
        event.currentTarget === event.target &&
        event.currentTarget === elementProps.ref?.current
      ) {
        elementProps.onFocus(event)
      }
    },
    [elementProps],
  )

  const handleSelectFiles = useCallback(
    (assetSource: S3AssetSource, files: File[]) => {
      if (directUploads && !readOnly) {
        onSelectFiles(assetSource, files)
      }
    },
    [directUploads, onSelectFiles, readOnly],
  )

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)

  const hasInvalidAssetSource =
    value &&
    typeof value.asset !== 'undefined' &&
    !value?._upload &&
    !(isVideoField ? isS3VideoSource(value) : isS3FileSource(value))

  if (hasInvalidAssetSource) {
    return <InvalidFileWarning onClearValue={clearField} />
  }

  return (
    <>
      {isStale && (
        <Box marginBottom={2}>
          <UploadWarning onClearStale={onClearUploadStatus} />
        </Box>
      )}
      <ChangeIndicator path={assetFieldPath} hasFocus={!!focused} isChanged={changed}>
        {/* not uploading */}
        {value?._upload ? (
          <UploadProgress
            uploadState={value._upload}
            onCancel={isUploading && onCancelUpload ? onCancelUpload : undefined}
            onStale={onStale}
          />
        ) : (
          <UploadTargetCard
            {...elementProps}
            assetSources={assetSources}
            border={hasValueOrUpload}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onSelectFile={({assetSource, file}) => handleSelectFiles(assetSource, [file])}
            radius={2}
            sizing="border"
            style={{padding: 1}}
            tabIndex={0}
            directUploads={directUploads}
            schemaType={schemaType}
          >
            <div style={{position: 'relative'}}>
              {!value?.asset && (
                <Card
                  tone={readOnly ? 'transparent' : 'inherit'}
                  border
                  paddingX={3}
                  paddingY={2}
                  radius={2}
                >
                  <UploadPlaceholder
                    type={isVideoField ? S3AssetType.VIDEO : S3AssetType.FILE}
                    readOnly={readOnly}
                    schemaType={schemaType}
                    assetSources={assetSources}
                    directUploads={directUploads}
                    onUpload={onSelectFiles}
                    browse={
                      <BrowserButton
                        id={id}
                        readOnly={readOnly}
                        assetSources={assetSources}
                        setSelectedAssetSource={setSelectedAssetSource}
                      />
                    }
                  />
                </Card>
              )}

              {!value?._upload && value?.asset && (
                <S3FileInputPreview
                  value={value}
                  readOnly={readOnly}
                  schemaType={schemaType}
                  assetSources={assetSources}
                  clearField={clearField}
                  observeAsset={observeAsset}
                  onSelectFiles={onSelectFiles}
                  setSelectedAssetSource={setSelectedAssetSource}
                />
              )}
            </div>
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </>
  )
}
