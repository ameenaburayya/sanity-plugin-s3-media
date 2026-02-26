import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {
  s3AssetFilenamePattern,
  s3FileAssetIdPattern,
  s3FileAssetFilenamePattern,
  s3ImageAssetIdPattern,
  s3ImageAssetFilenamePattern,
  s3VideoAssetIdPattern,
  s3VideoAssetFilenamePattern,
  s3VideoExtensions,
} from './constants'
import type {S3FileAssetIdParts, S3ImageAssetIdParts, S3UrlType, S3VideoAssetIdParts} from './types'

/**
 * @public
 */
export type S3AssetIdParts = S3FileAssetIdParts | S3ImageAssetIdParts | S3VideoAssetIdParts

function getFilename(input: string): string {
  if (!input) {
    return ''
  }

  let raw = input

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)) {
    try {
      raw = new URL(raw).pathname
    } catch {
      // Fall back to raw string handling below.
    }
  }

  const withoutQuery = raw.split('?')[0]?.split('#')[0] ?? raw
  const normalized = withoutQuery.replace(/^\/+/, '')
  const parts = normalized.split('/').filter(Boolean)

  return parts[parts.length - 1] ?? ''
}

/**
 * Parses an S3 file asset document ID into individual parts (type, id, extension)
 *
 * @param documentId - File asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseS3FileAssetId(documentId: string): S3FileAssetIdParts {
  const match = s3FileAssetIdPattern.exec(documentId)

  if (!match) {
    throw new Error(`Malformed file asset ID '${documentId}'.`)
  }

  const [, assetId, extension] = match
  return {type: S3AssetType.FILE, assetId, extension}
}

/**
 * Parses an S3 image asset document ID into individual parts (type, id, extension, width, height)
 *
 * @param documentId - Image asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseS3ImageAssetId(documentId: string): S3ImageAssetIdParts {
  const match = s3ImageAssetIdPattern.exec(documentId)

  if (!match) {
    throw new Error(`Malformed asset ID '${documentId}'.`)
  }

  const [, assetId, widthString, heightString, extension] = match
  const width = Number(widthString)
  const height = Number(heightString)

  if (!(width > 0) || !(height > 0)) {
    throw new Error(`Malformed asset ID '${documentId}'.`)
  }

  return {type: S3AssetType.IMAGE, assetId, width, height, extension}
}

/**
 * Parses an S3 video asset document ID into individual parts (type, id, extension, width, height)
 *
 * @param documentId - Video asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseS3VideoAssetId(documentId: string): S3VideoAssetIdParts {
  const match = s3VideoAssetIdPattern.exec(documentId)

  if (!match) {
    throw new Error(`Malformed asset ID '${documentId}'.`)
  }

  const [, assetId, widthString, heightString, extension] = match
  const width = Number(widthString)
  const height = Number(heightString)

  if (!(width > 0) || !(height > 0)) {
    throw new Error(`Malformed asset ID '${documentId}'.`)
  }

  return {type: S3AssetType.VIDEO, assetId, width, height, extension}
}

/**
 * Parses an S3 asset document ID into individual parts.
 *
 * @param documentId - Document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID is invalid
 */
export function parseS3AssetId(documentId: string): S3AssetIdParts {
  if (documentId.startsWith(`${S3AssetType.FILE}-`)) {
    return parseS3FileAssetId(documentId)
  }

  if (documentId.startsWith(`${S3AssetType.IMAGE}-`)) {
    return parseS3ImageAssetId(documentId)
  }

  if (documentId.startsWith(`${S3AssetType.VIDEO}-`)) {
    return parseS3VideoAssetId(documentId)
  }

  throw new Error(`Invalid S3 asset ID '${documentId}'.`)
}

/**
 * Parses an S3 file asset filename into individual parts (type, id, extension)
 *
 * @param filename - Filename to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If file name is invalid
 */
export function parseS3FileAssetFilename(filename: string): S3FileAssetIdParts {
  const file = getFilename(filename)
  const match = s3FileAssetFilenamePattern.exec(file)

  if (!match || s3ImageAssetFilenamePattern.test(file)) {
    throw new Error(`Malformed file asset filename '${filename}'.`)
  }

  const [, assetId, extension] = match
  return parseS3FileAssetId(`${S3AssetType.FILE}-${assetId}-${extension.toLowerCase()}`)
}

/**
 * Parses an S3 image asset filename into individual parts (type, id, extension, width, height)
 *
 * @param filename - Filename to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If image file name is invalid
 */
export function parseS3ImageAssetFilename(filename: string): S3ImageAssetIdParts {
  const file = getFilename(filename)
  const match = s3ImageAssetFilenamePattern.exec(file)

  if (!match) {
    throw new Error(`Malformed image asset filename '${filename}'.`)
  }

  const [, assetId, width, height, extension] = match
  return parseS3ImageAssetId(
    `${S3AssetType.IMAGE}-${assetId}-${width}x${height}-${extension.toLowerCase()}`,
  )
}

/**
 * Parses an S3 video asset filename into individual parts (type, id, extension, width, height)
 *
 * @param filename - Filename to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If video file name is invalid
 */
export function parseS3VideoAssetFilename(filename: string): S3VideoAssetIdParts {
  const file = getFilename(filename)
  const match = s3VideoAssetFilenamePattern.exec(file)

  if (!match) {
    throw new Error(`Malformed video asset filename '${filename}'.`)
  }

  const [, assetId, width, height, extension] = match
  return parseS3VideoAssetId(
    `${S3AssetType.VIDEO}-${assetId}-${width}x${height}-${extension.toLowerCase()}`,
  )
}

/**
 * Parses an S3 asset filename into individual parts.
 *
 * Note: image/video filenames share the same shape, so this function determines
 * image vs video using extension heuristics.
 *
 * @param filename - Filename to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If file name is invalid
 */
export function parseS3AssetFilename(filename: string): S3AssetIdParts {
  const file = getFilename(filename)

  if (!s3AssetFilenamePattern.test(file)) {
    throw new Error(`Malformed asset filename '${filename}'.`)
  }

  const match = s3ImageAssetFilenamePattern.exec(file)
  if (match) {
    const extension = match[4]?.toLowerCase() || ''

    if (s3VideoExtensions.has(extension)) {
      return parseS3VideoAssetFilename(file)
    }

    return parseS3ImageAssetFilename(file)
  }

  return parseS3FileAssetFilename(file)
}

/**
 * Parses a full S3 asset URL into individual parts.
 *
 * @param url - Full URL to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If URL is invalid
 */
export function parseS3AssetUrl(url: string): S3AssetIdParts {
  return parseS3AssetFilename(getFilename(url))
}

/**
 * Validates that a given URL is an S3 asset URL, and returns the asset type if valid.
 *
 * @param url - URL to extract asset type from
 * @returns Asset type if valid URL, false otherwise
 * @public
 */
export function getS3AssetUrlType(url: string): S3UrlType | false {
  try {
    const parsed = parseS3AssetUrl(url)

    if (parsed.type === S3AssetType.FILE) {
      return 'file'
    }

    if (parsed.type === S3AssetType.VIDEO) {
      return 'video'
    }

    return 'image'
  } catch {
    return false
  }
}
