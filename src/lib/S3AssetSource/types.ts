import type {SanityClient} from 'sanity'

import type {S3Client} from '../S3Client'

export interface CreateS3AssetSourceProps {
  sanityClient: SanityClient
  s3Client: S3Client
  title?: string
}
