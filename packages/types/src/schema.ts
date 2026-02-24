import type {S3AssetType, S3FileAsset, S3ImageAsset, S3VideoAsset} from './asset'

/** @internal */
interface Reference {
  _type: string
  _ref: string
  _key?: string
  _weak?: boolean
  _strengthenOnPublish?: {
    type: string
    weak?: boolean
    template?: {
      id: string
      params: Record<string, string | number | boolean>
    }
  }
}

/** @public */
export interface S3FileObjectStub {
  _type?: S3AssetType.FILE
  asset: Reference | S3FileAsset
  _upload?: unknown // For in-progress uploads
  [key: string]: unknown
}

/** @public */
export interface S3ImageObjectStub {
  _type?: S3AssetType.IMAGE
  asset: Reference | S3ImageAsset
  _upload?: unknown // For in-progress uploads
  [key: string]: unknown
}

/** @public */
export interface S3VideoObjectStub {
  _type?: S3AssetType.VIDEO
  asset: Reference | S3VideoAsset
  _upload?: unknown // For in-progress uploads
  [key: string]: unknown
}

/** @public */
export interface S3FileUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3FileAsset
  [key: string]: unknown
}

/** @public */
export interface S3ImageUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3ImageAsset
  [key: string]: unknown
}

/** @public */
export interface S3VideoUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3VideoAsset
  [key: string]: unknown
}

/** @public */
export type S3FileSource = Reference | S3FileAsset | S3FileObjectStub | S3FileUploadStub

/** @public */
export type S3ImageSource = Reference | S3ImageAsset | S3ImageObjectStub | S3ImageUploadStub

/** @public */
export type S3VideoSource = Reference | S3VideoAsset | S3VideoObjectStub | S3VideoUploadStub

/** @public */
export type S3AssetObjectStub = S3ImageObjectStub | S3FileObjectStub | S3VideoObjectStub

/** @public */
export interface S3ImageDimensions {
  _type: 's3ImageDimensions'
  height: number
  width: number
  aspectRatio: number
}

/** @public */
export type S3ImageMetaData = {
  _type: 's3ImageMetadata'
  dimensions: S3ImageDimensions
}

/** @public */
export interface S3VideoDimensions {
  _type: 's3VideoDimensions'
  height: number
  width: number
  aspectRatio: number
}

/** @public */
export type S3VideoMetaData = {
  _type: 's3VideoMetadata'
  dimensions: S3VideoDimensions
}
