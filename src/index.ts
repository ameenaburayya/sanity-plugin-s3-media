import type {S3FileDefinition, S3ImageDefinition} from './types'
import {buildS3FileUrl, buildS3ImageUrl} from './utils/asset/paths'
import {
  getS3AssetExtension,
  getS3ImageDimensions,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
} from './utils/resolve'

export {createS3Client, S3Client} from './lib'

export {
  buildS3FileUrl,
  buildS3ImageUrl,
  getS3AssetExtension,
  getS3ImageDimensions,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
}

export {s3Media} from './plugin'
export type {S3ImageDefinition, S3FileDefinition}

declare module 'sanity' {
  export interface IntrinsicDefinitions {
    s3File: S3FileDefinition
    s3Image: S3ImageDefinition
  }
}
