import type {S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'

export const getAssetResolution = (asset: S3ImageAsset | S3VideoAsset): string => {
  return `${asset.metadata.dimensions.width}x${asset.metadata.dimensions.height}px`
}
