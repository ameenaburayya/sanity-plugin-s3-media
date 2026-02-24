import {parseFileAssetId, parseImageAssetId, parseVideoAssetId} from './parse'

interface UrlBuilderOptions {
  baseUrl: string
}

/**
 * Builds the base file path from the minimal set of parts required to assemble it
 *
 * @param documentId - File asset document ID to build path from
 * @returns The path to the file
 * @public
 */
export function buildS3FilePath(documentId: string): string {
  const {assetId, extension} = parseFileAssetId(documentId)

  return `${assetId}.${extension}`
}

/**
 * Builds the base file URL from the minimal set of parts required to assemble it
 *
 * @param assetId - File asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the file, as a string
 * @public
 */
export function buildS3FileUrl(assetId: string, options: UrlBuilderOptions): string {
  const baseUrl = options.baseUrl

  return `${baseUrl}/${buildS3FilePath(assetId)}`
}

/**
 * Builds the base image path from the minimal set of parts required to assemble it
 *
 * @param documentId - Image asset document ID to build path from
 * @returns The path to the image
 * @public
 */
export function buildS3ImagePath(documentId: string): string {
  const {assetId, width, height, extension} = parseImageAssetId(documentId)

  return `${assetId}-${width}x${height}.${extension}`
}

/**
 * Builds the base image URL from the minimal set of parts required to assemble it
 *
 * @param assetId - Image asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the image, as a string
 * @public
 */
export function buildS3ImageUrl(assetId: string, options: UrlBuilderOptions): string {
  const baseUrl = options.baseUrl
  return `${baseUrl}/${buildS3ImagePath(assetId)}`
}

/**
 * Builds the base video path from the minimal set of parts required to assemble it
 *
 * @param documentId - Video asset document ID to build path from
 * @returns The path to the video
 * @public
 */
export function buildS3VideoPath(documentId: string): string {
  const {assetId, width, height, extension} = parseVideoAssetId(documentId)

  return `${assetId}-${width}x${height}.${extension}`
}

/**
 * Builds the base video URL from the minimal set of parts required to assemble it
 *
 * @param assetId - Video asset document ID to build URL from
 * @param options - Base URL configuration
 * @returns The URL to the video, as a string
 * @public
 */
export function buildS3VideoUrl(assetId: string, options: UrlBuilderOptions): string {
  const baseUrl = options.baseUrl
  return `${baseUrl}/${buildS3VideoPath(assetId)}`
}
