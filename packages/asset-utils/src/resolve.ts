import {type S3Asset, S3AssetType} from 'sanity-plugin-s3-media-types'

import {
  isInProgressUpload,
  isReference,
  isS3AssetObjectStub as isS3AssetObjectStubAsserter,
  isS3FileAsset,
  isS3ImageAsset,
  isS3VideoAsset,
} from './asserters'
import {s3AssetIdPattern, s3InProgressAssetExtension, s3InProgressAssetId} from './constants'
import {UnresolvableError} from './errors'
import {
  parseS3AssetFilename,
  parseS3AssetId,
  parseS3ImageAssetId,
  parseS3VideoAssetId,
} from './parse'
import {tryGetS3UrlFilename} from './paths'
import type {
  S3AssetSource,
  S3FileSource,
  S3ImageDimensions,
  S3ImageSource,
  S3VideoDimensions,
  S3VideoSource,
} from './types'
import {getForgivingResolver} from './utils'

/**
 * Tries to coerce a string (ID, URL, path or filename) to an S3 asset ID.
 *
 * @param str - Input string (ID, URL, path or filename)
 * @returns Asset document ID
 * @public
 * @throws {@link UnresolvableError}
 */
export function getS3IdFromString(str: string): string {
  if (s3AssetIdPattern.test(str)) {
    return str
  }

  const filename = tryGetS3UrlFilename(str)

  if (!filename) {
    throw new UnresolvableError(str)
  }

  const parsed = parseS3AssetFilename(filename)

  if (parsed.type === S3AssetType.FILE) {
    return `${S3AssetType.FILE}-${parsed.assetId}-${parsed.extension}`
  }

  return `${parsed.type}-${parsed.assetId}-${parsed.width}x${parsed.height}-${parsed.extension}`
}

/**
 * {@inheritDoc getS3IdFromString}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export const tryGetS3IdFromString = getForgivingResolver(getS3IdFromString)

/**
 * Tries to resolve the asset document ID from any inferrable structure
 *
 * @param src - Input source (image/file object, asset, reference, id, url, path)
 * @returns The asset document ID
 *
 * @throws {@link UnresolvableError}
 * Throws if passed asset source could not be resolved to an asset document ID
 * @public
 */
export function getS3AssetDocumentId(src: S3AssetSource): string {
  if (isInProgressUpload(src)) {
    return s3InProgressAssetId
  }

  const source = isS3AssetObjectStubAsserter(src) ? (src.asset as unknown) : (src as unknown)

  let id = ''

  if (typeof source === 'string') {
    id = getS3IdFromString(source)
  } else if (isReference(source)) {
    id = source._ref
  } else {
    const maybeAsset = source as S3Asset

    if (isS3FileAsset(maybeAsset) || isS3ImageAsset(maybeAsset) || isS3VideoAsset(maybeAsset)) {
      id = maybeAsset._id
    }
  }

  if (!id || !s3AssetIdPattern.test(id)) {
    throw new UnresolvableError(src)
  }

  return id
}

/**
 * {@inheritDoc getS3AssetDocumentId}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export const tryGetS3AssetDocumentId = getForgivingResolver(getS3AssetDocumentId)

/**
 * Returns the width, height and aspect ratio of a passed image asset, from any
 * inferrable structure (id, url, path, asset document, image object etc)
 *
 * @param src - Input source (image object, asset, reference, id, url, path)
 * @returns Object with width, height and aspect ratio properties
 *
 * @throws {@link UnresolvableError}
 * Throws if passed image source could not be resolved to an asset ID
 * @public
 */
export function getS3ImageDimensions(src: S3ImageSource): S3ImageDimensions {
  if (isInProgressUpload(src)) {
    return {width: 0, height: 0, aspectRatio: 0, _type: 's3ImageDimensions'}
  }

  const imageId = getS3AssetDocumentId(src)
  const {width, height} = parseS3ImageAssetId(imageId)
  const aspectRatio = width / height

  return {width, height, aspectRatio, _type: 's3ImageDimensions'}
}

/**
 * Returns the width, height and aspect ratio of a passed video asset, from any
 * inferrable structure (id, url, path, asset document, video object etc)
 *
 * @param src - Input source (video object, asset, reference, id, url, path)
 * @returns Object with width, height and aspect ratio properties
 *
 * @throws {@link UnresolvableError}
 * Throws if passed video source could not be resolved to an asset ID
 * @public
 */
export function getS3VideoDimensions(src: S3VideoSource): S3VideoDimensions {
  if (isInProgressUpload(src)) {
    return {width: 0, height: 0, aspectRatio: 0, _type: 's3VideoDimensions'}
  }

  const videoId = getS3AssetDocumentId(src)
  const {width, height} = parseS3VideoAssetId(videoId)
  const aspectRatio = width / height

  return {width, height, aspectRatio, _type: 's3VideoDimensions'}
}

const forgivingGetS3ImageDimensions = getForgivingResolver(getS3ImageDimensions)
const forgivingGetS3VideoDimensions = getForgivingResolver(getS3VideoDimensions)

/**
 * Returns the file extension for a given asset
 *
 * @param src - Input source (file/image/video object, asset, reference, id, url, path)
 * @returns The file extension, if resolvable (no `.` included)
 *
 * @throws {@link UnresolvableError}
 * Throws if passed asset source could not be resolved to an asset ID
 * @public
 */
export function getS3AssetExtension(src: S3AssetSource): string {
  if (isInProgressUpload(src)) {
    return s3InProgressAssetExtension
  }

  const assetId = getS3AssetDocumentId(src)

  return parseS3AssetId(assetId).extension
}

const forgivingGetS3AssetExtension = getForgivingResolver(getS3AssetExtension)

/**
 * {@inheritDoc getS3ImageDimensions}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export function tryGetS3ImageDimensions(src: S3ImageSource): S3ImageDimensions | undefined {
  return forgivingGetS3ImageDimensions(src)
}

/**
 * {@inheritDoc getS3VideoDimensions}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export function tryGetS3VideoDimensions(src: S3VideoSource): S3VideoDimensions | undefined {
  return forgivingGetS3VideoDimensions(src)
}

/**
 * {@inheritDoc getS3AssetExtension}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export function tryGetS3AssetExtension(src: S3AssetSource): string | undefined {
  return forgivingGetS3AssetExtension(src)
}

/**
 * Return whether or not the passed source is an s3 file source
 *
 * @param src - Source to check
 * @returns Whether or not the given source is an s3 file source
 * @public
 */
export function isS3FileSource(src: unknown): src is S3FileSource {
  const assetId = tryGetS3AssetDocumentId(src as S3AssetSource)

  return assetId ? assetId.startsWith(`${S3AssetType.FILE}-`) : false
}

/**
 * Return whether or not the passed source is an s3 image source
 *
 * @param src - Source to check
 * @returns Whether or not the given source is an s3 image source
 * @public
 */
export function isS3ImageSource(src: unknown): src is S3ImageSource {
  const assetId = tryGetS3AssetDocumentId(src as S3AssetSource)

  return assetId ? assetId.startsWith(`${S3AssetType.IMAGE}-`) : false
}

/**
 * Return whether or not the passed source is an s3 video source
 *
 * @param src - Source to check
 * @returns Whether or not the given source is an s3 video source
 * @public
 */
export function isS3VideoSource(src: unknown): src is S3VideoSource {
  const assetId = tryGetS3AssetDocumentId(src as S3AssetSource)

  return assetId ? assetId.startsWith(`${S3AssetType.VIDEO}-`) : false
}

/**
 * Returns image dimensions (without aspect ratio metadata wrapper) from any image source.
 *
 * @param src - Input source (image object, asset, reference, id)
 * @returns Object with width and height
 * @public
 */
export function getS3ImageDimensionsFromSource(src: S3ImageSource): {
  width: number
  height: number
} {
  if (isInProgressUpload(src)) {
    return {width: 0, height: 0}
  }

  const {width, height} = parseS3ImageAssetId(getS3AssetDocumentId(src))

  return {width, height}
}

/**
 * Returns video dimensions (without aspect ratio metadata wrapper) from any video source.
 *
 * @param src - Input source (video object, asset, reference, id)
 * @returns Object with width and height
 * @public
 */
export function getS3VideoDimensionsFromSource(src: S3VideoSource): {
  width: number
  height: number
} {
  if (isInProgressUpload(src)) {
    return {width: 0, height: 0}
  }

  const {width, height} = parseS3VideoAssetId(getS3AssetDocumentId(src))

  return {width, height}
}
