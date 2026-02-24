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
const hyphenatedFileId = 's3File-a-b-c-d-pdf'
const hyphenatedImageId = 's3Image-a-b-c-d-120x80-jpg'
const hyphenatedVideoId = 's3Video-a-b-c-d-1920x1080-mp4'

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

  it('parses asset ids when assetId contains dashes', () => {
    expect(parseFileAssetId(hyphenatedFileId)).toEqual({
      type: 's3File',
      assetId: 'a-b-c-d',
      extension: 'pdf',
    })
    expect(parseImageAssetId(hyphenatedImageId)).toEqual({
      type: 's3Image',
      assetId: 'a-b-c-d',
      width: 120,
      height: 80,
      extension: 'jpg',
    })
    expect(parseVideoAssetId(hyphenatedVideoId)).toEqual({
      type: 's3Video',
      assetId: 'a-b-c-d',
      width: 1920,
      height: 1080,
      extension: 'mp4',
    })
  })

  it('throws on malformed ids', () => {
    expect(() => parseFileAssetId('s3File-onlyassetid')).toThrow()
    expect(() => parseImageAssetId('s3Image-bad-id')).toThrow()
    expect(() => parseImageAssetId('s3Image-onlyasset')).toThrow()
    expect(() => parseImageAssetId('s3Image-id-0x80-jpg')).toThrow()
    expect(() => parseImageAssetId('s3Image-id-120x0-jpg')).toThrow()
    expect(() => parseVideoAssetId('s3Video-bad-id')).toThrow()
    expect(() => parseVideoAssetId('s3Video-onlyasset')).toThrow()
    expect(() => parseVideoAssetId('s3Video-id-0x1080-mp4')).toThrow()
    expect(() => parseVideoAssetId('s3Video-id-1920x0-mp4')).toThrow()
  })
})

describe('asset path building', () => {
  it('builds file paths and urls', () => {
    expect(buildS3FilePath(fileId)).toBe('abcdefghijklmnopqrstuvwx.pdf')
    expect(buildS3FileUrl(fileId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx.pdf',
    )
    expect(buildS3FilePath(hyphenatedFileId)).toBe('a-b-c-d.pdf')
  })

  it('builds image paths and urls', () => {
    expect(buildS3ImagePath(imageId)).toBe('abcdefghijklmnopqrstuvwx-120x80.jpg')
    expect(buildS3ImageUrl(imageId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-120x80.jpg',
    )
    expect(buildS3ImagePath(hyphenatedImageId)).toBe('a-b-c-d-120x80.jpg')
  })

  it('builds video paths and urls', () => {
    expect(buildS3VideoPath(videoId)).toBe('abcdefghijklmnopqrstuvwx-1920x1080.mp4')
    expect(buildS3VideoUrl(videoId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-1920x1080.mp4',
    )
    expect(buildS3VideoPath(hyphenatedVideoId)).toBe('a-b-c-d-1920x1080.mp4')
  })
})
