import {
  buildS3FilePath,
  buildS3FileUrl,
  buildS3ImagePath,
  buildS3ImageUrl,
  buildS3VideoPath,
  buildS3VideoUrl,
} from '../asset'
import {parseFileAssetId, parseImageAssetId, parseVideoAssetId} from '../asset/parse'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg'
const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'

describe('asset id parsing', () => {
  it('parses file asset ids', () => {
    expect(parseFileAssetId(fileId)).toEqual({
      type: 's3File',
      assetId: 'abcdefghijklmnopqrstuvwx',
      extension: 'pdf',
    })
  })

  it('parses image asset ids', () => {
    expect(parseImageAssetId(imageId)).toEqual({
      type: 's3Image',
      assetId: 'abcdefghijklmnopqrstuvwx',
      width: 120,
      height: 80,
      extension: 'jpg',
    })
  })

  it('parses video asset ids', () => {
    expect(parseVideoAssetId(videoId)).toEqual({
      type: 's3Video',
      assetId: 'abcdefghijklmnopqrstuvwx',
      width: 1920,
      height: 1080,
      extension: 'mp4',
    })
  })

  it('throws on malformed ids', () => {
    expect(() => parseFileAssetId('s3File-onlyassetid')).toThrow()
    expect(() => parseImageAssetId('s3Image-bad-id')).toThrow()
    expect(() => parseImageAssetId('s3Image-onlyasset')).toThrow()
    expect(() => parseVideoAssetId('s3Video-bad-id')).toThrow()
    expect(() => parseVideoAssetId('s3Video-onlyasset')).toThrow()
  })
})

describe('asset path building', () => {
  it('builds file paths and urls', () => {
    expect(buildS3FilePath(fileId)).toBe('abcdefghijklmnopqrstuvwx.pdf')
    expect(buildS3FileUrl(fileId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx.pdf',
    )
  })

  it('builds image paths and urls', () => {
    expect(buildS3ImagePath(imageId)).toBe('abcdefghijklmnopqrstuvwx-120x80.jpg')
    expect(buildS3ImageUrl(imageId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-120x80.jpg',
    )
  })

  it('builds video paths and urls', () => {
    expect(buildS3VideoPath(videoId)).toBe('abcdefghijklmnopqrstuvwx-1920x1080.mp4')
    expect(buildS3VideoUrl(videoId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-1920x1080.mp4',
    )
  })
})
