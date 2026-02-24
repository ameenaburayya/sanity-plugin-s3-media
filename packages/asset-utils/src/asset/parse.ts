import {
  S3AssetType,
  type S3FileAssetIdParts,
  type S3ImageAssetIdParts,
  type S3VideoAssetIdParts,
} from 'sanity-plugin-s3-media-types'

const fileAssetIdPattern = /^s3File-([a-zA-Z0-9_-]+)-([a-z0-9]+)$/
const imageAssetIdPattern = /^s3Image-([a-zA-Z0-9_-]+)-(\d+)x(\d+)-([a-z0-9]+)$/
const videoAssetIdPattern = /^s3Video-([a-zA-Z0-9_-]+)-(\d+)x(\d+)-([a-z0-9]+)$/

/**
 * Parses a S3 file asset document ID into individual parts (type, id, extension)
 *
 * @param documentId - File asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseFileAssetId(documentId: string): S3FileAssetIdParts {
  const match = fileAssetIdPattern.exec(documentId)

  if (!match) {
    throw new Error(`Malformed file asset ID '${documentId}'.`)
  }
  const [, assetId, extension] = match

  return {type: S3AssetType.FILE, assetId, extension}
}

/**
 * Parses a S3 image asset document ID into individual parts (type, id, extension, width, height)
 *
 * @param documentId - Image asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseImageAssetId(documentId: string): S3ImageAssetIdParts {
  const match = imageAssetIdPattern.exec(documentId)

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
 * Parses a S3 video asset document ID into individual parts (type, id, extension, width, height)
 *
 * @param documentId - Video asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseVideoAssetId(documentId: string): S3VideoAssetIdParts {
  const match = videoAssetIdPattern.exec(documentId)

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
