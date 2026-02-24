import {get} from 'lodash'
import {type FC, useCallback, useMemo} from 'react'
import type {Observable} from 'rxjs'
import {type AssetFromSource, type AssetSourceComponentAction, useTranslation} from 'sanity'
import {S3AssetType, type S3FileAsset, type S3VideoAsset} from 'sanity-plugin-s3-media-types'

import {WithReferencedAsset} from '../../../components'
import type {S3AssetSource} from '../../../types'
import type {S3FileInputProps} from '../types'
import {S3FileSkeleton} from './S3FileSkeleton'

type S3FileInputAssetSourceProps = Pick<S3FileInputProps, 'value' | 'schemaType'> & {
  isUploading: boolean
  observeAsset: (id: string) => Observable<S3FileAsset | S3VideoAsset>
  setSelectedAssetSource: (assetSource: S3AssetSource | null) => void
  onSelectAssets: (assetsFromSource: AssetFromSource[]) => void
  selectedAssetSource: S3AssetSource | null
}

export const S3FileInputAssetSource: FC<S3FileInputAssetSourceProps> = (props) => {
  const {
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    setSelectedAssetSource,
    onSelectAssets,
    value,
  } = props

  const {t} = useTranslation()

  const isVideoField = schemaType.name === 's3Video'

  const accept = get(schemaType, 'options.accept', isVideoField ? 'video/*' : '')

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)
  }, [setSelectedAssetSource])

  const action: AssetSourceComponentAction = useMemo(
    () => (isUploading ? 'upload' : 'select'),
    [isUploading],
  )

  const assetType = isVideoField ? S3AssetType.VIDEO : S3AssetType.FILE
  const dialogHeaderTitle = isVideoField ? 'S3 Video' : t('inputs.file.dialog.title')

  if (!selectedAssetSource) {
    return null
  }

  const Component = selectedAssetSource.component

  if (value && value.asset) {
    return (
      <WithReferencedAsset
        observeAsset={observeAsset}
        reference={value.asset}
        waitPlaceholder={<S3FileSkeleton />}
      >
        {(fileAsset) => (
          <Component
            accept={accept}
            action={action}
            assetSource={selectedAssetSource}
            assetType={assetType}
            dialogHeaderTitle={dialogHeaderTitle}
            onClose={handleAssetSourceClosed}
            onSelect={onSelectAssets}
            schemaType={schemaType}
            selectedAssets={[fileAsset]}
            selectionType="single"
          />
        )}
      </WithReferencedAsset>
    )
  }
  return (
    <Component
      accept={accept}
      action={action}
      assetSource={selectedAssetSource}
      assetType={assetType}
      dialogHeaderTitle={dialogHeaderTitle}
      onClose={handleAssetSourceClosed}
      onSelect={onSelectAssets}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
    />
  )
}
