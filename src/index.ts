import type {S3FileDefinition, S3ImageDefinition} from './types'

export {s3Media} from './plugin'
export type {S3ImageDefinition, S3FileDefinition}

declare module 'sanity' {
  export interface IntrinsicDefinitions {
    s3File: S3FileDefinition
    s3Image: S3ImageDefinition
  }
}
