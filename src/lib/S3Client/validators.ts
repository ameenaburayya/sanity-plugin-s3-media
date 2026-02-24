import type {S3AssetType} from 'sanity-plugin-s3-media-types'

import {SUPPORTED_ASSET_TYPES} from '../../constants'

export const validateAssetType = (type: S3AssetType): void => {
  if (SUPPORTED_ASSET_TYPES.indexOf(type) === -1) {
    throw new Error(
      `Invalid asset type: ${type}. Must be one of ${SUPPORTED_ASSET_TYPES.join(', ')}`,
    )
  }
}
