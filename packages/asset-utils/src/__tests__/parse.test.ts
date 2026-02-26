import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {
  getS3AssetUrlType,
  parseS3AssetFilename,
  parseS3AssetId,
  parseS3AssetUrl,
  parseS3FileAssetFilename,
  parseS3FileAssetId,
  parseS3ImageAssetFilename,
  parseS3ImageAssetId,
  parseS3VideoAssetFilename,
  parseS3VideoAssetId,
} from '../parse'

const assetId = 'abcdefghijklmnopqrstuvwx'
const fileId = `${S3AssetType.FILE}-${assetId}-pdf`
const imageId = `${S3AssetType.IMAGE}-${assetId}-120x80-jpg`
const videoId = `${S3AssetType.VIDEO}-${assetId}-1920x1080-mp4`

describe('parse', () => {
  describe('parseS3FileAssetId', () => {
    it('parses valid file IDs', () => {
      expect(parseS3FileAssetId(fileId)).toEqual({
        type: S3AssetType.FILE,
        assetId,
        extension: 'pdf',
      })
    })

    it('throws for malformed file IDs', () => {
      expect(() => parseS3FileAssetId('s3File-bad')).toThrow(
        "Malformed file asset ID 's3File-bad'.",
      )
    })
  })

  describe('parseS3ImageAssetId', () => {
    it('parses valid image IDs', () => {
      expect(parseS3ImageAssetId(imageId)).toEqual({
        type: S3AssetType.IMAGE,
        assetId,
        width: 120,
        height: 80,
        extension: 'jpg',
      })
    })

    it('throws for malformed image IDs', () => {
      expect(() => parseS3ImageAssetId('s3Image-bad')).toThrow("Malformed asset ID 's3Image-bad'.")
    })

    it('throws when image dimensions are invalid', () => {
      expect(() => parseS3ImageAssetId(`s3Image-${assetId}-0x10-jpg`)).toThrow(
        `Malformed asset ID 's3Image-${assetId}-0x10-jpg'.`,
      )
    })
  })

  describe('parseS3VideoAssetId', () => {
    it('parses valid video IDs', () => {
      expect(parseS3VideoAssetId(videoId)).toEqual({
        type: S3AssetType.VIDEO,
        assetId,
        width: 1920,
        height: 1080,
        extension: 'mp4',
      })
    })

    it('throws for malformed video IDs', () => {
      expect(() => parseS3VideoAssetId('s3Video-bad')).toThrow("Malformed asset ID 's3Video-bad'.")
    })

    it('throws when video dimensions are invalid', () => {
      expect(() => parseS3VideoAssetId(`s3Video-${assetId}-0x10-mp4`)).toThrow(
        `Malformed asset ID 's3Video-${assetId}-0x10-mp4'.`,
      )
    })
  })

  describe('parseS3AssetId', () => {
    it('parses file, image and video IDs', () => {
      expect(parseS3AssetId(fileId).type).toBe(S3AssetType.FILE)
      expect(parseS3AssetId(imageId).type).toBe(S3AssetType.IMAGE)
      expect(parseS3AssetId(videoId).type).toBe(S3AssetType.VIDEO)
    })

    it('throws for invalid IDs', () => {
      expect(() => parseS3AssetId('not-an-s3-id')).toThrow("Invalid S3 asset ID 'not-an-s3-id'.")
    })
  })

  describe('parseS3FileAssetFilename', () => {
    it('parses valid file filenames and normalizes extension casing', () => {
      expect(parseS3FileAssetFilename(`${assetId}.PDF`)).toEqual({
        type: S3AssetType.FILE,
        assetId,
        extension: 'pdf',
      })
    })

    it('parses filenames from full URLs', () => {
      expect(
        parseS3FileAssetFilename(`https://cdn.example.com/assets/${assetId}.pdf?dl=1#hash`),
      ).toEqual({
        type: S3AssetType.FILE,
        assetId,
        extension: 'pdf',
      })
    })

    it('throws when filename has image/video shape', () => {
      expect(() => parseS3FileAssetFilename(`${assetId}-120x80.jpg`)).toThrow(
        `Malformed file asset filename '${assetId}-120x80.jpg'.`,
      )
    })

    it('throws when filename is invalid', () => {
      expect(() => parseS3FileAssetFilename('invalid')).toThrow(
        "Malformed file asset filename 'invalid'.",
      )
    })
  })

  describe('parseS3ImageAssetFilename', () => {
    it('parses valid image filenames and normalizes extension casing', () => {
      expect(parseS3ImageAssetFilename(`${assetId}-120x80.JPG`)).toEqual({
        type: S3AssetType.IMAGE,
        assetId,
        width: 120,
        height: 80,
        extension: 'jpg',
      })
    })

    it('throws for invalid image filenames', () => {
      expect(() => parseS3ImageAssetFilename(`${assetId}.jpg`)).toThrow(
        `Malformed image asset filename '${assetId}.jpg'.`,
      )
    })
  })

  describe('parseS3VideoAssetFilename', () => {
    it('parses valid video filenames and normalizes extension casing', () => {
      expect(parseS3VideoAssetFilename(`${assetId}-1920x1080.MP4`)).toEqual({
        type: S3AssetType.VIDEO,
        assetId,
        width: 1920,
        height: 1080,
        extension: 'mp4',
      })
    })

    it('throws for invalid video filenames', () => {
      expect(() => parseS3VideoAssetFilename(`${assetId}.mp4`)).toThrow(
        `Malformed video asset filename '${assetId}.mp4'.`,
      )
    })
  })

  describe('parseS3AssetFilename', () => {
    it('parses file/image/video filenames', () => {
      expect(parseS3AssetFilename(`${assetId}.pdf`).type).toBe(S3AssetType.FILE)
      expect(parseS3AssetFilename(`${assetId}-120x80.jpg`).type).toBe(S3AssetType.IMAGE)
      expect(parseS3AssetFilename(`${assetId}-1920x1080.mp4`).type).toBe(S3AssetType.VIDEO)
    })

    it('throws for invalid filenames', () => {
      expect(() => parseS3AssetFilename('invalid')).toThrow("Malformed asset filename 'invalid'.")
    })

    it('throws for empty input', () => {
      expect(() => parseS3AssetFilename('')).toThrow("Malformed asset filename ''.")
    })

    it('throws for path-only input without filename', () => {
      expect(() => parseS3AssetFilename('/')).toThrow("Malformed asset filename '/'.")
    })

    it('handles malformed absolute URL-like values', () => {
      expect(() => parseS3AssetFilename('https://%')).toThrow(
        "Malformed asset filename 'https://%'.",
      )
    })
  })

  describe('parseS3AssetUrl', () => {
    it('parses asset parts from full URLs', () => {
      expect(parseS3AssetUrl(`https://cdn.example.com/assets/${assetId}.pdf`)).toEqual({
        type: S3AssetType.FILE,
        assetId,
        extension: 'pdf',
      })
    })
  })

  describe('getS3AssetUrlType', () => {
    it('returns the specific asset URL type', () => {
      expect(getS3AssetUrlType(`https://cdn.example.com/assets/${assetId}.pdf`)).toBe('file')
      expect(getS3AssetUrlType(`https://cdn.example.com/assets/${assetId}-120x80.jpg`)).toBe(
        'image',
      )
      expect(getS3AssetUrlType(`https://cdn.example.com/assets/${assetId}-1920x1080.mp4`)).toBe(
        'video',
      )
    })

    it('returns false for invalid URLs', () => {
      expect(getS3AssetUrlType('https://cdn.example.com/assets/not-an-asset')).toBe(false)
    })
  })
})
