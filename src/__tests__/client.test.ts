import {createS3Client as createS3ClientExport, S3Client as S3ClientExport} from '../client'
import {createS3Client, S3Client} from '../lib'

describe('client exports', () => {
  it('re-exports client factory and class from lib', () => {
    expect(createS3ClientExport).toBe(createS3Client)
    expect(S3ClientExport).toBe(S3Client)
  })
})
