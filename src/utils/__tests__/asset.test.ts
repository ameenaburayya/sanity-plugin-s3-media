import {buildS3FilePath, buildS3FileUrl, buildS3ImagePath, buildS3ImageUrl} from '../asset'
import {parseFileAssetId, parseImageAssetId} from '../asset/parse'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg'

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

  it('throws on malformed ids', () => {
    expect(() => parseImageAssetId('s3Image-bad-id')).toThrow()
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
})
