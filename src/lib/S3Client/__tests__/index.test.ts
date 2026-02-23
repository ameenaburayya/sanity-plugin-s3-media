import {createS3Client, S3Client} from '../index'
import {S3Client as DirectS3Client} from '../S3Client'

describe('S3Client index exports', () => {
  it('re-exports S3Client', () => {
    expect(S3Client).toBe(DirectS3Client)
  })

  it('wires createS3Client to return a configured S3Client instance', () => {
    const client = createS3Client({bucketKey: 'bucket-key'} as any)

    expect(client).toBeInstanceOf(DirectS3Client)
    expect(client.config()).toEqual({bucketKey: 'bucket-key'})
  })
})
