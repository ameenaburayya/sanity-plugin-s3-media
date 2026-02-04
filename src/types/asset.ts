import type {ComponentType, ReactNode} from 'react'
import type {
  AssetFromSource,
  AssetSourceComponentAction,
  AssetSourceUploaderClass,
  SanityDocument,
} from 'sanity'

import type {S3FileSchemaType, S3ImageMetaData, S3ImageSchemaType} from './schema'

/** @public */
export interface S3AssetDocument extends SanityDocument {
  _id: string
  _type: 's3FileAsset' | 's3ImageAsset'
  assetId: string
  extension: string
  mimeType: string
  sha1hash: string
  size: number
  originalFilename?: string
}

/** @public */
export type S3FileAsset = S3AssetDocument & {_type: 's3FileAsset'}

/** @public */
export type S3ImageAsset = S3AssetDocument & {_type: 's3ImageAsset'; metadata: S3ImageMetaData}

/** @public */
export type S3Asset = S3FileAsset | S3ImageAsset

/** @public */
export enum S3AssetType {
  FILE = 's3File',
  IMAGE = 's3Image',
}

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
  schemaType?: S3ImageSchemaType | S3FileSchemaType
  assetToOpen?: S3AssetDocument
}

export interface S3AssetSource {
  name: string
  title?: string
  component: ComponentType<S3AssetSourceComponentProps>
  icon?: ComponentType
  Uploader?: AssetSourceUploaderClass
}

export interface S3FileAssetIdParts {
  type: 's3File'
  assetId: string
  extension: string
}

export interface S3ImageAssetIdParts {
  type: 's3Image'
  assetId: string
  extension: string
  width: number
  height: number
}
