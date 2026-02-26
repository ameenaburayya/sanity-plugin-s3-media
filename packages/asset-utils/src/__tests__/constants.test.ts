import {
  s3AssetFilenamePattern,
  s3FileAssetFilenamePattern,
  s3FileAssetIdPattern,
  s3AssetIdPattern,
  s3ImageAssetFilenamePattern,
  s3ImageAssetIdPattern,
  s3InProgressAssetExtension,
  s3InProgressAssetId,
  s3VideoAssetFilenamePattern,
  s3VideoAssetIdPattern,
  s3VideoExtensions,
} from '../constants'

describe('constants', () => {
  it('matches valid asset ids', () => {
    expect(s3FileAssetIdPattern.test('s3File-abc123-pdf')).toBe(true)
    expect(s3ImageAssetIdPattern.test('s3Image-abc123-120x80-jpg')).toBe(true)
    expect(s3VideoAssetIdPattern.test('s3Video-abc123-1920x1080-mp4')).toBe(true)
    expect(s3AssetIdPattern.test('s3File-abc123-pdf')).toBe(true)
    expect(s3AssetIdPattern.test('s3Image-abc123-120x80-jpg')).toBe(true)
    expect(s3AssetIdPattern.test('s3Video-abc123-1920x1080-mp4')).toBe(true)
  })

  it('matches valid asset filenames', () => {
    expect(s3FileAssetFilenamePattern.test('abc123.pdf')).toBe(true)
    expect(s3ImageAssetFilenamePattern.test('abc123-120x80.jpg')).toBe(true)
    expect(s3VideoAssetFilenamePattern.test('abc123-1920x1080.mp4')).toBe(true)
    expect(s3AssetFilenamePattern.test('abc123.pdf')).toBe(true)
    expect(s3AssetFilenamePattern.test('abc123-120x80.jpg')).toBe(true)
  })

  it('rejects malformed ids and filenames', () => {
    expect(s3FileAssetIdPattern.test('s3File-abc123')).toBe(false)
    expect(s3ImageAssetIdPattern.test('s3Image-abc123-jpg')).toBe(false)
    expect(s3VideoAssetIdPattern.test('s3Video-abc123-mp4')).toBe(false)
    expect(s3AssetIdPattern.test('not-an-asset-id')).toBe(false)

    expect(s3FileAssetFilenamePattern.test('abc123')).toBe(false)
    expect(s3ImageAssetFilenamePattern.test('abc123.jpg')).toBe(false)
    expect(s3VideoAssetFilenamePattern.test('abc123.mp4')).toBe(false)
    expect(s3AssetFilenamePattern.test('bad/name.jpg')).toBe(false)
  })

  it('exposes placeholder constants and known video extensions', () => {
    expect(s3InProgressAssetId).toBe('upload-in-progress-placeholder')
    expect(s3InProgressAssetExtension).toBe('tmp')
    expect(s3VideoExtensions.has('mp4')).toBe(true)
    expect(s3VideoExtensions.has('mov')).toBe(true)
    expect(s3VideoExtensions.has('jpg')).toBe(false)
  })
})
