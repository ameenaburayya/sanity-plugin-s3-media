import * as assetUtils from '../asset-utils'
import * as paths from '../utils/asset/paths'
import * as resolve from '../utils/resolve'

describe('asset-utils exports', () => {
  const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
  const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x50-png'
  const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'

  it('re-exports path and resolve helpers', () => {
    expect(assetUtils.buildS3FileUrl).toBe(paths.buildS3FileUrl)
    expect(assetUtils.buildS3ImageUrl).toBe(paths.buildS3ImageUrl)
    expect(assetUtils.buildS3VideoUrl).toBe(paths.buildS3VideoUrl)

    expect(assetUtils.getS3AssetExtension).toBe(resolve.getS3AssetExtension)
    expect(assetUtils.getS3ImageDimensions).toBe(resolve.getS3ImageDimensions)
    expect(assetUtils.getS3VideoDimensions).toBe(resolve.getS3VideoDimensions)
    expect(assetUtils.tryGetS3AssetExtension).toBe(resolve.tryGetS3AssetExtension)
    expect(assetUtils.tryGetS3ImageDimensions).toBe(resolve.tryGetS3ImageDimensions)
    expect(assetUtils.tryGetS3VideoDimensions).toBe(resolve.tryGetS3VideoDimensions)
  })

  it('uses real helper behavior', () => {
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
})
