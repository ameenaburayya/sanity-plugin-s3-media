import {
  S3AssetType,
  type S3Asset,
  type S3AssetObjectStub,
  type S3FileAsset,
  type S3FileSource,
  type S3FileUploadStub,
  type S3ImageAsset,
  type S3ImageDimensions,
  type S3ImageSource,
  type S3ImageUploadStub,
} from '../types'
import {parseImageAssetId} from './asset/parse'
import {isObject} from './isObject'
import {isReference} from 'sanity'

/**
 * A "safe function" is a wrapped function that would normally throw an UnresolvableError,
 * but will instead return `undefined`. Other errors are still thrown.
 *
 * @public
 */
type SafeFunction<Args extends unknown[], Return> = (...args: Args) => Return | undefined

const idPattern = new RegExp(
  `^(?:` +
    `${S3AssetType.IMAGE}-(?:[a-zA-Z0-9_]{24,40}|[a-f0-9]{40})+-\\d+x\\d+-[a-z0-9]+` +
    `|` +
    `${S3AssetType.FILE}-(?:[a-zA-Z0-9_]{24,40}|[a-f0-9]{40})+-[a-z0-9]+` +
    `)$`
)

/**
 * Placeholder asset _ids for in-progress uploads
 * @internal
 */
const inProgressAssetId = 'upload-in-progress-placeholder'

/**
 * Error type thrown when the library fails to resolve a value, such as an asset ID,
 * filename or project ID/dataset information.
 *
 * The `input` property holds the value passed as the input, which failed to be
 * resolved to something meaningful.
 *
 * @public
 */
class UnresolvableError extends Error {
  unresolvable = true

  // The input may not be a valid source, so let's not type it as one
  input?: unknown

  constructor(inputSource: unknown, message = 'Failed to resolve asset ID from source') {
    super(message)
    this.input = inputSource
  }
}

/**
 * Checks whether or not an error instance is of type UnresolvableError
 *
 * @param err - Error to check for unresolvable error type
 * @returns True if the passed error instance appears to be an unresolvable error
 * @public
 */
function isUnresolvableError(err: unknown): err is UnresolvableError {
  const error = err as UnresolvableError
  return Boolean(error.unresolvable && 'input' in error)
}

/**
 * Returns a getter which returns `undefined` instead of throwing,
 * if encountering an `UnresolvableError`
 *
 * @param method - Function to use as resolver
 * @returns Function that returns `undefined` if passed resolver throws UnresolvableError
 * @internal
 */
function getForgivingResolver<Args extends unknown[], Return>(
  method: (...args: Args) => Return
): SafeFunction<Args, Return> {
  return (...args: Args): Return | undefined => {
    try {
      return method(...args)
    } catch (err) {
      if (isUnresolvableError(err)) {
        return undefined
      }

      throw err
    }
  }
}

/**
 * Checks whether or not the given source is an in-progress upload
 * (has upload property but no asset property)
 *
 * @param stub - Possible in-progress upload
 * @returns Whether or not the passed object is an in-progress upload
 * @public
 */
export function isInProgressUpload(stub: unknown): stub is S3ImageUploadStub | S3FileUploadStub {
  const item = stub as S3ImageUploadStub | S3FileUploadStub
  return isObject(item) && Boolean(item._upload) && !('asset' in item)
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
 * Tries to resolve the asset document ID from any inferrable structure
 *
 * @param src - Input source (image/file object, asset, reference, id, url, path)
 * @returns The asset document ID
 *
 * @throws {@link UnresolvableError}
 * Throws if passed asset source could not be resolved to an asset document ID
 * @public
 */
export function getS3AssetDocumentId(src: S3FileSource | S3ImageSource): string {
  // Check if this is an in-progress upload (has upload but no asset)
  if (isInProgressUpload(src)) {
    // Return a placeholder ID that indicates in-progress state
    // This allows the render cycle to continue until asset is available
    return inProgressAssetId
  }

  const source = isS3AssetObjectStub(src) ? src.asset : src

  let id = ''

  if (isReference(source)) {
    id = source._ref
  } else {
    id = source._id
  }

  const hasId = id && idPattern.test(id)

  if (!hasId) {
    throw new UnresolvableError(src)
  }

  return id
}

/**
 * {@inheritDoc getS3AssetDocumentId}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
const tryGetS3AssetDocumentId = getForgivingResolver(getS3AssetDocumentId)

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
  // Check if this is an in-progress upload
  if (isInProgressUpload(src)) {
    // Return placeholder dimensions for in-progress uploads
    return {width: 0, height: 0, aspectRatio: 0, _type: 's3ImageDimensions'}
  }

  const imageId = getS3AssetDocumentId(src)
  const {width, height} = parseImageAssetId(imageId)
  const aspectRatio = width / height

  return {width, height, aspectRatio, _type: 's3ImageDimensions'}
}

/**
 * {@inheritDoc getS3ImageDimensions}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export const tryGetS3ImageDimensions = getForgivingResolver(getS3ImageDimensions)

/**
 * Return whether or not the passed source is an s3 file source
 *
 * @param src - Source to check
 * @returns Whether or not the given source is an s3 file source
 * @public
 */
export function isS3FileSource(src: unknown): src is S3FileSource {
  const assetId = tryGetS3AssetDocumentId(src as S3FileSource)
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
  const assetId = tryGetS3AssetDocumentId(src as S3ImageSource)

  return assetId ? assetId.startsWith(`${S3AssetType.IMAGE}-`) : false
}

export const isS3FileAsset = (asset: S3Asset): asset is S3FileAsset => {
  return (asset as S3FileAsset)._type === 's3FileAsset'
}

export const isS3ImageAsset = (asset: S3Asset): asset is S3ImageAsset => {
  return (asset as S3ImageAsset)._type === 's3ImageAsset'
}
