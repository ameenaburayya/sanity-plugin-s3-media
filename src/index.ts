import type {S3FileDefinition, S3ImageDefinition, S3VideoDefinition} from './types'

export {s3Media} from './plugin'
export type {S3ImageDefinition, S3FileDefinition, S3VideoDefinition}
export {useS3MediaContext} from './contexts'

declare module 'sanity' {
  export interface IntrinsicDefinitions {
    s3File: S3FileDefinition
    s3Image: S3ImageDefinition
    s3Video: S3VideoDefinition
  }
}
