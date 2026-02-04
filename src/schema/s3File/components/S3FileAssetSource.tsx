import {get} from 'lodash'
import {type FC, useCallback, useMemo} from 'react'
import type {Observable} from 'rxjs'
import {type AssetFromSource, type AssetSourceComponentAction,useTranslation} from 'sanity'

import {WithReferencedAsset} from '../../../components'
import {type S3AssetSource, S3AssetType, type S3FileAsset} from '../../../types'
import type {S3FileInputProps} from '../types'
import {S3FileSkeleton} from './S3FileSkeleton'

type S3FileAssetSourceProps = Pick<S3FileInputProps, 'value' | 'schemaType'> & {
  isUploading: boolean
  observeAsset: (id: string) => Observable<S3FileAsset>
  setSelectedAssetSource: (assetSource: S3AssetSource | null) => void
  onSelectAssets: (assetsFromSource: AssetFromSource[]) => void
  selectedAssetSource: S3AssetSource | null
}

export const S3FileAssetSource: FC<S3FileAssetSourceProps> = (props) => {
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

  const accept = get(schemaType, 'options.accept', '')

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)
  }, [setSelectedAssetSource])

  const action: AssetSourceComponentAction = useMemo(
    () => (isUploading ? 'upload' : 'select'),
    [isUploading],
  )

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
            assetType={S3AssetType.FILE}
            dialogHeaderTitle={t('inputs.file.dialog.title')}
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
      assetType={S3AssetType.FILE}
      dialogHeaderTitle={t('inputs.file.dialog.title')}
      onClose={handleAssetSourceClosed}
      onSelect={onSelectAssets}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
    />
  )
}
