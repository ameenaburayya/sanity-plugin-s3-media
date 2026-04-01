import {
  isInProgressUpload,
  isReference,
  isS3AssetId,
  isS3AssetObjectStub,
  isS3FileAsset,
  isS3FileAssetId,
  isS3ImageAsset,
  isS3ImageAssetId,
  isS3VideoAsset,
  isS3VideoAssetId,
} from '../asserters'

const mockS3FileAsset = {_type: 's3FileAsset' as const}
const mockS3ImageAsset = {_type: 's3ImageAsset' as const}
const mockS3VideoAsset = {_type: 's3VideoAsset' as const}

type S3AssetLike = Parameters<typeof isS3FileAsset>[0]

const typedMockS3FileAsset = mockS3FileAsset as unknown as S3AssetLike
const typedMockS3ImageAsset = mockS3ImageAsset as unknown as S3AssetLike
const typedMockS3VideoAsset = mockS3VideoAsset as unknown as S3AssetLike

describe('asserters', () => {
  it('checks basic reference shapes', () => {
    expect(isReference({_ref: 's3File-abc-pdf'})).toBe(true)
    expect(isReference({_ref: 123})).toBe(false)
  })

  it('checks s3 asset id patterns', () => {
    expect(isS3FileAssetId('s3File-abc123-pdf')).toBe(true)
    expect(isS3ImageAssetId('s3Image-abc123-10x20-jpg')).toBe(true)
    expect(isS3VideoAssetId('s3Video-abc123-1920x1080-mp4')).toBe(true)

    expect(isS3AssetId('s3File-abc123-pdf')).toBe(true)
    expect(isS3AssetId('s3Image-abc123-10x20-jpg')).toBe(true)
    expect(isS3AssetId('s3Video-abc123-1920x1080-mp4')).toBe(true)
    expect(isS3AssetId('invalid')).toBe(false)
  })

  it('checks upload and object stub states', () => {
    expect(isInProgressUpload({_upload: {step: 'uploading'}})).toBe(true)
    expect(isInProgressUpload({_upload: {}, asset: {_id: 's3File-abc123-pdf'}})).toBe(false)

    expect(isS3AssetObjectStub({asset: {_id: 's3File-abc123-pdf'}})).toBe(true)
    expect(isS3AssetObjectStub({asset: 'not-object'})).toBe(false)
  })

  it('checks asset document _type guards', () => {
    expect(isS3FileAsset(typedMockS3FileAsset)).toBe(true)
    expect(isS3FileAsset(typedMockS3ImageAsset)).toBe(false)

    expect(isS3ImageAsset(typedMockS3ImageAsset)).toBe(true)
    expect(isS3ImageAsset(typedMockS3VideoAsset)).toBe(false)

    expect(isS3VideoAsset(typedMockS3VideoAsset)).toBe(true)
    expect(isS3VideoAsset(typedMockS3FileAsset)).toBe(false)
  })
})
