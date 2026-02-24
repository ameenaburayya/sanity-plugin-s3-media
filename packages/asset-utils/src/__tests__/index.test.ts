import * as assetUtils from '../index'

describe('public api', () => {
  const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
  const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x50-png'
  const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'

  it('exports all utility helpers with real behavior', () => {
    expect(assetUtils.buildS3FileUrl(fileId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx.pdf',
    )
    expect(assetUtils.buildS3ImageUrl(imageId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-100x50.png',
    )
    expect(assetUtils.buildS3VideoUrl(videoId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-1920x1080.mp4',
    )

    expect(assetUtils.getS3AssetExtension({_id: fileId} as any)).toBe('pdf')
    expect(assetUtils.getS3ImageDimensions({_id: imageId} as any)).toEqual({
      _type: 's3ImageDimensions',
      width: 100,
      height: 50,
      aspectRatio: 2,
    })
    expect(assetUtils.getS3VideoDimensions({_id: videoId} as any)).toEqual({
      _type: 's3VideoDimensions',
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
    })

    expect(assetUtils.tryGetS3AssetExtension({} as any)).toBeUndefined()
    expect(assetUtils.tryGetS3ImageDimensions({} as any)).toBeUndefined()
    expect(assetUtils.tryGetS3VideoDimensions({} as any)).toBeUndefined()
  })

  it('re-exports S3AssetType', () => {
    expect(assetUtils.S3AssetType.FILE).toBe('s3File')
    expect(assetUtils.S3AssetType.IMAGE).toBe('s3Image')
    expect(assetUtils.S3AssetType.VIDEO).toBe('s3Video')
  })

  it('does not pull in sanity at runtime', async () => {
    vi.resetModules()

    vi.doMock('sanity', () => {
      throw new Error('sanity runtime import is not allowed in asset-utils')
    })

    await expect(import('../resolve')).resolves.toBeDefined()

    vi.doUnmock('sanity')
  })
})
