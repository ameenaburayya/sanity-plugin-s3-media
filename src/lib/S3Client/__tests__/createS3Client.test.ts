import {createS3Client} from '../createS3Client'
import {S3Client as DirectS3Client} from '../S3Client'
import type {S3ClientConfig} from '../types'

describe('createS3Client', () => {
  it('returns a configured S3Client instance', () => {
    const client = createS3Client({bucketKey: 'bucket-key'} satisfies S3ClientConfig)

    expect(client).toBeInstanceOf(DirectS3Client)
    expect(client.config()).toEqual({bucketKey: 'bucket-key'})
  })
})
