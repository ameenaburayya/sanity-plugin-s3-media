import {getS3AssetUrlType} from './parse'

/**
 * Checks whether or not a given URL is a valid S3 asset URL
 *
 * @param url - URL to test
 * @returns True if url is a valid S3 asset URL, false otherwise
 * @public
 */
export function isS3AssetUrl(url: string): boolean {
  return getS3AssetUrlType(url) !== false
}

/**
 * Checks whether or not a given URL is a valid S3 image asset URL
 *
 * @param url - URL to test
 * @returns True if url is a valid S3 image asset URL, false otherwise
 * @public
 */
export function isS3ImageUrl(url: string): boolean {
  return getS3AssetUrlType(url) === 'image'
}

/**
 * Checks whether or not a given URL is a valid S3 file asset URL
 *
 * @param url - URL to test
 * @returns True if url is a valid S3 file asset URL, false otherwise
 * @public
 */
export function isS3FileUrl(url: string): boolean {
  return getS3AssetUrlType(url) === 'file'
}

/**
 * Checks whether or not a given URL is a valid S3 video asset URL
 *
 * @param url - URL to test
 * @returns True if url is a valid S3 video asset URL, false otherwise
 * @public
 */
export function isS3VideoUrl(url: string): boolean {
  return getS3AssetUrlType(url) === 'video'
}
