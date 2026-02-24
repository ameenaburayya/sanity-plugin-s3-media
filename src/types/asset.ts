import type {ComponentType, ReactNode} from 'react'
import type {AssetFromSource, AssetSourceComponentAction, AssetSourceUploaderClass} from 'sanity'
import type {S3AssetDocument, S3AssetType} from 'sanity-plugin-s3-media-types'

import type {S3FileSchemaType, S3ImageSchemaType, S3VideoSchemaType} from './schema'

/** @public */
export interface S3AssetSourceComponentProps {
  action?: AssetSourceComponentAction
  assetSource: S3AssetSource
  assetType?: S3AssetType
  accept: string
  selectionType: 'single'
  dialogHeaderTitle?: ReactNode
  selectedAssets: S3AssetDocument[]
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  onChangeAction?: (action: AssetSourceComponentAction) => void
  schemaType?: S3ImageSchemaType | S3FileSchemaType | S3VideoSchemaType
  assetToOpen?: S3AssetDocument
}

/** @public */
export interface S3AssetSource {
  name: string
  title?: string
  component: ComponentType<S3AssetSourceComponentProps>
  icon?: ComponentType
  Uploader?: AssetSourceUploaderClass
}
