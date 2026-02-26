import {S3AssetType} from 'sanity-plugin-s3-media-types'

/**
 * @internal
 */
export const s3FileAssetIdPattern = /^s3File-([a-zA-Z0-9_-]+)-([a-z0-9]+)$/

/**
 * @internal
 */
export const s3ImageAssetIdPattern = /^s3Image-([a-zA-Z0-9_-]+)-(\d+)x(\d+)-([a-z0-9]+)$/

/**
 * @internal
 */
export const s3VideoAssetIdPattern = /^s3Video-([a-zA-Z0-9_-]+)-(\d+)x(\d+)-([a-z0-9]+)$/

/**
 * @internal
 */
export const s3FileAssetFilenamePattern = /^([a-zA-Z0-9_-]+)\.([a-z0-9]+)$/i

/**
 * @internal
 */
export const s3ImageAssetFilenamePattern = /^([a-zA-Z0-9_-]+)-(\d+)x(\d+)\.([a-z0-9]+)$/i

/**
 * @internal
 */
export const s3VideoAssetFilenamePattern = /^([a-zA-Z0-9_-]+)-(\d+)x(\d+)\.([a-z0-9]+)$/i

/**
 * @internal
 */
export const s3AssetFilenamePattern = /^([a-zA-Z0-9_-]+)(?:-(\d+)x(\d+))?\.([a-z0-9]+)$/i

/**
 * @internal
 */
export const s3AssetIdPattern = new RegExp(
  `^(?:` +
    `${S3AssetType.IMAGE}-[a-zA-Z0-9_-]+-\\d+x\\d+-[a-z0-9]+` +
    `|` +
    `${S3AssetType.VIDEO}-[a-zA-Z0-9_-]+-\\d+x\\d+-[a-z0-9]+` +
    `|` +
    `${S3AssetType.FILE}-[a-zA-Z0-9_-]+-[a-z0-9]+` +
    `)$`,
)

/**
 * @internal
 */
export const s3InProgressAssetId = 'upload-in-progress-placeholder'

/**
 * @internal
 */
export const s3InProgressAssetExtension = 'tmp'

/**
 * @internal
 */
export const s3VideoExtensions = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'avi',
  'mkv',
  'wmv',
  'flv',
  'mpeg',
  'mpg',
  '3gp',
  'ogv',
])
