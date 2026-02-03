import {get} from 'lodash'
import {type FC, useCallback, useMemo} from 'react'
import type {Observable} from 'rxjs'
import {
  type AssetFromSource,
  type AssetSourceComponentAction,
  type AssetSourceUploader,
} from 'sanity'

import {WithReferencedAsset} from '../../../components'
import {S3AssetType, type S3AssetSource, type S3ImageAsset} from '../../../types'
import {type S3ImageInputProps} from '../types'

type S3ImageInputAssetSourceProps = Pick<S3ImageInputProps, 'value' | 'schemaType'> & {
  observeAsset: (assetId: string) => Observable<S3ImageAsset>
  isUploading: boolean
  selectedAssetSource: S3AssetSource | null
  handleAssetSourceClosed: () => void
  handleSelectAssetFromSource: (assetFromSource: AssetFromSource[]) => void
}

export const S3ImageInputAssetSource: FC<S3ImageInputAssetSourceProps> = (props) => {
  const {
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    value,
  } = props

  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])

  // Determine the action based on state - derived from props
  const action: AssetSourceComponentAction = useMemo(
    () => (isUploading ? 'upload' : 'select'),
    [isUploading]
  )

  const handleClose = useCallback(() => {
    handleAssetSourceClosed()
  }, [handleAssetSourceClosed])

  if (!selectedAssetSource) {
    return null
  }
  const {component: Component} = selectedAssetSource

  if (value && value.asset) {
    return (
      <WithReferencedAsset observeAsset={observeAsset} reference={value.asset}>
        {(imageAsset) => (
          <Component
            accept={accept}
            action={action}
            assetSource={selectedAssetSource}
            assetType={S3AssetType.IMAGE}
            onClose={handleClose}
            onSelect={handleSelectAssetFromSource}
            schemaType={schemaType}
            selectedAssets={[imageAsset]}
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
      assetType={S3AssetType.IMAGE}
      onClose={handleClose}
      onSelect={handleSelectAssetFromSource}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
    />
  )
}
