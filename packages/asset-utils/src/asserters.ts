import type {S3Asset, S3FileAsset, S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'

import {s3FileAssetIdPattern, s3ImageAssetIdPattern, s3VideoAssetIdPattern} from './constants'
import type {
  Reference,
  S3AssetObjectStub,
  S3FileUploadStub,
  S3ImageUploadStub,
  S3VideoUploadStub,
} from './types'
import {isObject} from './utils'

/**
 * Checks whether or not the given source is a reference object
 * (an object containing _ref string key)
 *
 * @param ref - Possible reference
 * @returns Whether or not the passed object is a reference
 * @public
 */
export function isReference(ref: unknown): ref is Reference {
  return isObject(ref) && typeof (ref as Reference)._ref === 'string'
}

/**
 * Checks whether or not the given document ID is a valid S3 file asset document ID
 *
 * @param documentId - Document ID to check
 * @returns Whether or not the given document ID is an S3 file asset document ID
 * @public
 */
export function isS3FileAssetId(documentId: string): boolean {
  return s3FileAssetIdPattern.test(documentId)
}

/**
 * Checks whether or not the given document ID is a valid S3 image asset document ID
 *
 * @param documentId - Document ID to check
 * @returns Whether or not the given document ID is an S3 image asset document ID
 * @public
 */
export function isS3ImageAssetId(documentId: string): boolean {
  return s3ImageAssetIdPattern.test(documentId)
}

/**
 * Checks whether or not the given document ID is a valid S3 video asset document ID
 *
 * @param documentId - Document ID to check
 * @returns Whether or not the given document ID is an S3 video asset document ID
 * @public
 */
export function isS3VideoAssetId(documentId: string): boolean {
  return s3VideoAssetIdPattern.test(documentId)
}

/**
 * Checks whether or not the given document ID is a valid S3 asset document ID (file/image/video)
 *
 * @param documentId - Document ID to check
 * @returns Whether or not the given document ID is an S3 asset document ID
 * @public
 */
export function isS3AssetId(documentId: string): boolean {
  return isS3FileAssetId(documentId) || isS3ImageAssetId(documentId) || isS3VideoAssetId(documentId)
}

/**
 * Checks whether or not the given source is an asset object stub
 *
 * @param stub - Possible asset object stub
 * @returns Whether or not the passed object is an object stub
 * @public
 */
export function isS3AssetObjectStub(stub: unknown): stub is S3AssetObjectStub {
  const item = stub as S3AssetObjectStub

  return isObject(item) && Boolean(item.asset) && typeof item.asset === 'object'
}

/**
 * Checks whether or not the given source is an in-progress upload
 * (has upload property but no asset property)
 *
 * @param stub - Possible in-progress upload
 * @returns Whether or not the passed object is an in-progress upload
 * @public
 */
export function isInProgressUpload(
  stub: unknown,
): stub is S3ImageUploadStub | S3FileUploadStub | S3VideoUploadStub {
  const item = stub as S3ImageUploadStub | S3FileUploadStub | S3VideoUploadStub

  return isObject(item) && Boolean(item._upload) && !('asset' in item)
}

/**
 * Return whether or not the passed asset document is an s3 file asset
 *
 * @param asset - Asset document to check
 * @returns Whether or not the given asset is an s3 file asset
 * @public
 */
export function isS3FileAsset(asset: S3Asset): asset is S3FileAsset {
  return (asset as S3FileAsset)._type === 's3FileAsset'
}

/**
 * Return whether or not the passed asset document is an s3 image asset
 *
 * @param asset - Asset document to check
 * @returns Whether or not the given asset is an s3 image asset
 * @public
 */
export function isS3ImageAsset(asset: S3Asset): asset is S3ImageAsset {
  return (asset as S3ImageAsset)._type === 's3ImageAsset'
}

/**
 * Return whether or not the passed asset document is an s3 video asset
 *
 * @param asset - Asset document to check
 * @returns Whether or not the given asset is an s3 video asset
 * @public
 */
export function isS3VideoAsset(asset: S3Asset): asset is S3VideoAsset {
  return (asset as S3VideoAsset)._type === 's3VideoAsset'
}
