export {
  buildS3FilePath,
  buildS3FileUrl,
  buildS3ImagePath,
  buildS3ImageUrl,
  buildS3VideoPath,
  buildS3VideoUrl,
} from './asset/paths'
export {parseFileAssetId, parseImageAssetId, parseVideoAssetId} from './asset/parse'
export {
  getS3AssetDocumentId,
  getS3AssetExtension,
  getS3ImageDimensions,
  getS3ImageDimensionsFromSource,
  getS3VideoDimensions,
  getS3VideoDimensionsFromSource,
  isInProgressUpload,
  isS3AssetObjectStub,
  isUnresolvableError,
  isS3FileAsset,
  isS3FileSource,
  isS3ImageAsset,
  isS3ImageSource,
  isS3VideoAsset,
  isS3VideoSource,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
  tryGetS3VideoDimensions,
} from './resolve'

export {S3AssetType} from 'sanity-plugin-s3-media-types'

export type {
  S3Asset,
  S3AssetDocument,
  S3FileAsset,
  S3FileAssetIdParts,
  S3FileSource,
  S3ImageAsset,
  S3ImageAssetIdParts,
  S3ImageDimensions,
  S3ImageSource,
  S3VideoAsset,
  S3VideoAssetIdParts,
  S3VideoDimensions,
  S3VideoSource,
} from 'sanity-plugin-s3-media-types'
