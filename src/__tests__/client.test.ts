import {createS3Client as createS3ClientExport, S3Client as S3ClientExport} from '../client'

const {createS3Client, S3Client} = vi.hoisted(() => ({
  createS3Client: vi.fn(),
  S3Client: class MockS3Client {},
}))

vi.mock('../lib', () => ({
  createS3Client,
  S3Client,
}))

describe('client exports', () => {
  it('re-exports client factory and class from lib', () => {
    expect(createS3ClientExport).toBe(createS3Client)
    expect(S3ClientExport).toBe(S3Client)
  })
})
