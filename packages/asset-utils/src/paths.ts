import {s3AssetFilenamePattern} from './constants'
import {UnresolvableError} from './errors'
import {parseS3FileAssetId, parseS3ImageAssetId, parseS3VideoAssetId} from './parse'
import {getForgivingResolver} from './utils'

/**
 * @public
 */
export interface S3UrlBuilderOptions {
  baseUrl: string
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
}

/**
 * Builds the base file path from the minimal set of parts required to assemble it
 *
 * @param documentId - File asset document ID to build path from
 * @returns The path to the file
 * @public
 */
export function buildS3FilePath(documentId: string): string {
  const {assetId, extension} = parseS3FileAssetId(documentId)

  return `${assetId}.${extension}`
}

/**
 * Builds the base file URL from the minimal set of parts required to assemble it
 *
 * @param documentId - File asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the file, as a string
 * @public
 */
export function buildS3FileUrl(documentId: string, options: S3UrlBuilderOptions): string {
  return `${options.baseUrl}/${buildS3FilePath(documentId)}`
}

/**
 * Builds the base image path from the minimal set of parts required to assemble it
 *
 * @param documentId - Image asset document ID to build path from
 * @returns The path to the image
 * @public
 */
export function buildS3ImagePath(documentId: string): string {
  const {assetId, width, height, extension} = parseS3ImageAssetId(documentId)

  return `${assetId}-${width}x${height}.${extension}`
}

/**
 * Builds the base image URL from the minimal set of parts required to assemble it
 *
 * @param documentId - Image asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the image, as a string
 * @public
 */
export function buildS3ImageUrl(documentId: string, options: S3UrlBuilderOptions): string {
  return `${options.baseUrl}/${buildS3ImagePath(documentId)}`
}

/**
 * Builds the base video path from the minimal set of parts required to assemble it
 *
 * @param documentId - Video asset document ID to build path from
 * @returns The path to the video
 * @public
 */
export function buildS3VideoPath(documentId: string): string {
  const {assetId, width, height, extension} = parseS3VideoAssetId(documentId)

  return `${assetId}-${width}x${height}.${extension}`
}

/**
 * Builds the base video URL from the minimal set of parts required to assemble it
 *
 * @param documentId - Video asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the video, as a string
 * @public
 */
export function buildS3VideoUrl(documentId: string, options: S3UrlBuilderOptions): string {
  return `${options.baseUrl}/${buildS3VideoPath(documentId)}`
}

/**
 * Checks whether or not a given filename matches the expected S3 asset filename pattern
 *
 * @param filename - Filename to check for validity
 * @returns Whether or not the specified filename is valid
 * @public
 */
export function isValidS3Filename(filename: string): boolean {
  if (!filename || filename.includes('/')) {
    return false
  }

  return s3AssetFilenamePattern.test(filename)
}

/**
 * Strips query params/hash and returns the path portion from a URL or raw path.
 *
 * @param urlOrPath - URL or path to extract from
 * @returns Normalized path without leading slash
 * @public
 * @throws If URL/path could not be resolved
 */
export function getS3UrlPath(urlOrPath: string): string {
  if (typeof urlOrPath !== 'string' || !urlOrPath.trim()) {
    throw new UnresolvableError(urlOrPath, 'Failed to resolve path from URL/path')
  }

  if (isAbsoluteUrl(urlOrPath)) {
    const pathname = new URL(urlOrPath).pathname.replace(/^\/+/, '')

    if (!pathname) {
      throw new UnresolvableError(urlOrPath, 'Failed to resolve path from URL/path')
    }

    return pathname
  }

  const normalized =
    urlOrPath.split('?')[0]?.split('#')[0]?.replace(/^\/+/, '') || urlOrPath.replace(/^\/+/, '')

  if (!normalized) {
    throw new UnresolvableError(urlOrPath, 'Failed to resolve path from URL/path')
  }

  return normalized
}

/**
 * {@inheritDoc getS3UrlPath}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export const tryGetS3UrlPath = getForgivingResolver(getS3UrlPath)

/**
 * Returns the last path segment (asset filename) from a URL or path.
 *
 * @param urlOrPath - URL or path to parse
 * @returns The filename portion
 * @public
 * @throws If URL/path could not be resolved to an asset filename
 */
export function getS3UrlFilename(urlOrPath: string): string {
  const path = getS3UrlPath(urlOrPath)
  const parts = path.split('/').filter(Boolean)
  const filename = parts[parts.length - 1]

  if (!isValidS3Filename(filename)) {
    throw new UnresolvableError(
      urlOrPath,
      `Failed to resolve filename from URL/path '${urlOrPath}'`,
    )
  }

  return filename
}

/**
 * {@inheritDoc getS3UrlFilename}
 * @returns Returns `undefined` instead of throwing if a value cannot be resolved
 * @public
 */
export const tryGetS3UrlFilename = getForgivingResolver(getS3UrlFilename)
