import {parseFileAssetId, parseImageAssetId} from './parse'

interface UrlBuilderOptions {
  baseUrl: string
}

/**
 * Builds the base file path from the minimal set of parts required to assemble it
 *
 * @param asset - An asset-like shape defining ID, dimensions and extension
 * @param options - Project ID and dataset the file belongs to, along with other options
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
 * @param asset - An asset-like shape defining ID and extension
 * @param options - Project ID and dataset the file belongs to, along with other options
 * @returns The URL to the file, as a string
 * @public
 */
export function buildS3FileUrl(assetId: string, options: UrlBuilderOptions): string {
  const baseUrl = options?.baseUrl

  return `${baseUrl}/${buildS3FilePath(assetId)}`
}

/**
 * Builds the base image path from the minimal set of parts required to assemble it
 *
 * @param asset - An asset-like shape defining ID, dimensions and extension
 * @param options - Project ID and dataset the image belongs to, along with other options
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
 * @param asset - An asset-like shape defining ID, dimensions and extension
 * @param options - Project ID and dataset the image belongs to
 * @returns The URL to the image, as a string
 * @public
 */
export function buildS3ImageUrl(assetId: string, options: UrlBuilderOptions): string {
  const baseUrl = options?.baseUrl
  return `${baseUrl}/${buildS3ImagePath(assetId)}`
}
