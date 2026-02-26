import type {S3FileAsset, S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'

/**
 * A "safe function" is a wrapped function that would normally throw an UnresolvableError,
 * but will instead return `undefined`. Other errors are still thrown.
 *
 * @public
 */
export type SafeFunction<Args extends unknown[], Return> = (...args: Args) => Return | undefined

/**
 * @public
 */
export interface Reference {
  _ref: string
  _weak?: boolean
}

/**
 * @public
 */
export interface S3FileAssetIdParts {
  type: 's3File'
  assetId: string
  extension: string
}

/**
 * @public
 */
export interface S3ImageAssetIdParts {
  type: 's3Image'
  assetId: string
  extension: string
  width: number
  height: number
}

/**
 * @public
 */
export interface S3VideoAssetIdParts {
  type: 's3Video'
  assetId: string
  extension: string
  width: number
  height: number
}

/**
 * @public
 */
export interface S3FileObjectStub {
  _type?: 's3File'
  asset: Reference | S3FileAsset
  _upload?: unknown
  [key: string]: unknown
}

/**
 * @public
 */
export interface S3ImageObjectStub {
  _type?: 's3Image'
  asset: Reference | S3ImageAsset
  _upload?: unknown
  [key: string]: unknown
}

/**
 * @public
 */
export interface S3VideoObjectStub {
  _type?: 's3Video'
  asset: Reference | S3VideoAsset
  _upload?: unknown
  [key: string]: unknown
}

/**
 * @public
 */
export interface S3FileUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3FileAsset
  [key: string]: unknown
}

/**
 * @public
 */
export interface S3ImageUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3ImageAsset
  [key: string]: unknown
}

/**
 * @public
 */
export interface S3VideoUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3VideoAsset
  [key: string]: unknown
}

/**
 * @public
 */
export type S3FileSource = Reference | S3FileAsset | S3FileObjectStub | S3FileUploadStub

/**
 * @public
 */
export type S3ImageSource = Reference | S3ImageAsset | S3ImageObjectStub | S3ImageUploadStub

/**
 * @public
 */
export type S3VideoSource = Reference | S3VideoAsset | S3VideoObjectStub | S3VideoUploadStub

/**
 * @public
 */
export type S3AssetObjectStub = S3ImageObjectStub | S3FileObjectStub | S3VideoObjectStub

/**
 * @public
 */
export interface S3ImageDimensions {
  _type: 's3ImageDimensions'
  height: number
  width: number
  aspectRatio: number
}

/**
 * @public
 */
export interface S3VideoDimensions {
  _type: 's3VideoDimensions'
  height: number
  width: number
  aspectRatio: number
}

/**
 * @public
 */
export type S3AssetStringSource = string

/**
 * @public
 */
export type S3AssetSource = S3ImageSource | S3VideoSource | S3FileSource

/**
 * @public
 */
export type S3UrlType = 'file' | 'image' | 'video'
