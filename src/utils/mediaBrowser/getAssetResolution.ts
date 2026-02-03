import type {S3ImageAsset} from '../../types'

export const getAssetResolution = (asset: S3ImageAsset): string => {
  return `${asset.metadata.dimensions.width}x${asset.metadata.dimensions.height}px`
}
