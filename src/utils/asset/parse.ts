import type {S3FileAssetIdParts, S3ImageAssetIdParts} from '../../types'

/**
 * Parses a S3 file asset document ID into individual parts (type, id, extension)
 *
 * @param documentId - File asset document ID to parse into named parts
 * @returns Object of named properties
 * @public
 * @throws If document ID invalid
 */
export function parseFileAssetId(documentId: string): S3FileAssetIdParts {
  const [, assetId, extension] = documentId.split('-')

  if (!assetId || !extension) {
    throw new Error(`Malformed file asset ID '${documentId}'.`)
  }

  return {type: 's3File', assetId, extension}
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
  const [, assetId, dimensionString, extension] = documentId.split('-')
  const [width, height] = (dimensionString || '').split('x').map(Number)

  if (!assetId || !dimensionString || !extension || !(width > 0) || !(height > 0)) {
    throw new Error(`Malformed asset ID '${documentId}'.`)
  }

  return {type: 's3Image', assetId, width, height, extension}
}
