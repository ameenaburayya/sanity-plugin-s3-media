import type {S3ImageMetaData, S3VideoMetaData} from './schema'

/** @internal */
interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
  [key: string]: unknown
}

/** @public */
export interface S3AssetDocument extends SanityDocument {
  _id: string
  _type: 's3FileAsset' | 's3ImageAsset' | 's3VideoAsset'
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
export type S3VideoAsset = S3AssetDocument & {_type: 's3VideoAsset'; metadata: S3VideoMetaData}

/** @public */
export type S3Asset = S3FileAsset | S3ImageAsset | S3VideoAsset

/** @public */
export enum S3AssetType {
  FILE = 's3File',
  IMAGE = 's3Image',
  VIDEO = 's3Video',
}

/** @public */
export interface S3FileAssetIdParts {
  type: 's3File'
  assetId: string
  extension: string
}

/** @public */
export interface S3ImageAssetIdParts {
  type: 's3Image'
  assetId: string
  extension: string
  width: number
  height: number
}

/** @public */
export interface S3VideoAssetIdParts {
  type: 's3Video'
  assetId: string
  extension: string
  width: number
  height: number
}
