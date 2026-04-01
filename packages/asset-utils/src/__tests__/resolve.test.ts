import type {S3FileAsset, S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'

import {
  isInProgressUpload,
  isS3AssetObjectStub,
  isS3FileAsset,
  isS3ImageAsset,
  isS3VideoAsset,
} from '../asserters'
import {
  getS3AssetDocumentId,
  getS3AssetExtension,
  getS3IdFromString,
  getS3ImageDimensions,
  getS3ImageDimensionsFromSource,
  getS3VideoDimensions,
  getS3VideoDimensionsFromSource,
  isS3FileSource,
  isS3ImageSource,
  isS3VideoSource,
  tryGetS3AssetExtension,
  tryGetS3IdFromString,
  tryGetS3ImageDimensions,
  tryGetS3VideoDimensions,
} from '../resolve'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x200-jpg'
const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'
const fileAsset: S3FileAsset = {
  _createdAt: '2020-01-01T00:00:00.000Z',
  _updatedAt: '2020-01-01T00:00:00.000Z',
  _rev: 'rev',
  _id: fileId,
  _type: 's3FileAsset',
  assetId: 'abcdefghijklmnopqrstuvwx',
  extension: 'pdf',
  mimeType: 'application/pdf',
  sha1hash: 'hash',
  size: 12,
}

const imageAsset: S3ImageAsset = {
  _createdAt: '2020-01-01T00:00:00.000Z',
  _updatedAt: '2020-01-01T00:00:00.000Z',
  _rev: 'rev',
  _id: imageId,
  _type: 's3ImageAsset',
  assetId: 'abcdefghijklmnopqrstuvwx',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: 'hash',
  size: 12,
  metadata: {
    _type: 's3ImageMetadata',
    dimensions: {
      _type: 's3ImageDimensions',
      height: 200,
      width: 100,
      aspectRatio: 0.5,
    },
  },
}

const videoAsset: S3VideoAsset = {
  _createdAt: '2020-01-01T00:00:00.000Z',
  _updatedAt: '2020-01-01T00:00:00.000Z',
  _rev: 'rev',
  _id: videoId,
  _type: 's3VideoAsset',
  assetId: 'abcdefghijklmnopqrstuvwx',
  extension: 'mp4',
  mimeType: 'video/mp4',
  sha1hash: 'hash',
  size: 12,
  metadata: {
    _type: 's3VideoMetadata',
    dimensions: {
      _type: 's3VideoDimensions',
      height: 1080,
      width: 1920,
      aspectRatio: 1920 / 1080,
    },
  },
}

describe('resolve helpers', () => {
  it('identifies in-progress uploads and object stubs', () => {
    expect(isInProgressUpload({_upload: {stage: 'uploading'}})).toBe(true)
    expect(isInProgressUpload({_upload: {}, asset: fileAsset})).toBe(false)
    expect(isInProgressUpload(null)).toBe(false)

    expect(isS3AssetObjectStub({asset: fileAsset})).toBe(true)
    expect(isS3AssetObjectStub({asset: 'not-object'})).toBe(false)
    expect(isS3AssetObjectStub(undefined)).toBe(false)
  })

  it('returns placeholder for in-progress uploads', () => {
    const stub = {_upload: {}}

    expect(getS3AssetDocumentId(stub)).toBe('upload-in-progress-placeholder')
    expect(getS3ImageDimensions(stub)).toEqual({
      _type: 's3ImageDimensions',
      width: 0,
      height: 0,
      aspectRatio: 0,
    })
    expect(getS3VideoDimensions(stub)).toEqual({
      _type: 's3VideoDimensions',
      width: 0,
      height: 0,
      aspectRatio: 0,
    })
  })

  it('resolves ids from references and assets', () => {
    const ref = {_type: 'reference', _ref: imageId}

    expect(getS3AssetDocumentId(ref)).toBe(imageId)

    const asset = fileAsset

    expect(getS3AssetDocumentId(asset)).toBe(fileId)

    const objectStub = {asset}

    expect(getS3AssetDocumentId(objectStub)).toBe(fileId)

    const videoRef = {_type: 'reference', _ref: videoId}

    expect(getS3AssetDocumentId(videoRef)).toBe(videoId)
  })

  it('resolves ids from string sources', () => {
    expect(getS3AssetDocumentId({_ref: fileId})).toBe(fileId)
    expect(
      getS3AssetDocumentId({_ref: 'https://cdn.example.com/abcdefghijklmnopqrstuvwx-100x200.jpg'}),
    ).toBe(imageId)
  })

  it('throws on invalid ids', () => {
    expect(() =>
      getS3AssetDocumentId({
        ...fileAsset,
        _id: 'nope',
      }),
    ).toThrow()
  })

  it('extracts image dimensions', () => {
    const asset = imageAsset

    expect(getS3ImageDimensions(asset)).toEqual({
      _type: 's3ImageDimensions',
      width: 100,
      height: 200,
      aspectRatio: 0.5,
    })
  })

  it('extracts video dimensions', () => {
    const asset = videoAsset

    expect(getS3VideoDimensions(asset)).toEqual({
      _type: 's3VideoDimensions',
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    })
  })

  it('extracts dimensions directly from source helpers', () => {
    expect(getS3ImageDimensionsFromSource(imageAsset)).toEqual({
      width: 100,
      height: 200,
    })
    expect(getS3VideoDimensionsFromSource(videoAsset)).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('returns placeholder dimensions from source helpers for in-progress uploads', () => {
    const stub = {_upload: {}}

    expect(getS3ImageDimensionsFromSource(stub)).toEqual({width: 0, height: 0})
    expect(getS3VideoDimensionsFromSource(stub)).toEqual({width: 0, height: 0})
  })

  it('identifies file and image sources', () => {
    expect(isS3FileSource(fileAsset)).toBe(true)
    expect(isS3FileSource(imageAsset)).toBe(false)
    expect(
      isS3FileSource({
        ...fileAsset,
        _id: 's3File-invalid',
      }),
    ).toBe(false)
    expect(isS3ImageSource(imageAsset)).toBe(true)
    expect(isS3ImageSource(fileAsset)).toBe(false)
    expect(
      isS3ImageSource({
        ...imageAsset,
        _id: 's3Image-invalid',
      }),
    ).toBe(false)
    expect(isS3VideoSource(videoAsset)).toBe(true)
    expect(isS3VideoSource(fileAsset)).toBe(false)
    expect(
      isS3VideoSource({
        ...videoAsset,
        _id: 's3Video-invalid',
      }),
    ).toBe(false)
  })

  it('resolves extensions and in-progress extension placeholders', () => {
    expect(getS3AssetExtension(fileAsset)).toBe('pdf')
    expect(getS3AssetExtension(imageAsset)).toBe('jpg')
    expect(getS3AssetExtension(videoAsset)).toBe('mp4')
    expect(getS3AssetExtension({_upload: {}})).toBe('tmp')
  })

  it('safe resolvers return undefined for unresolvable ids', () => {
    expect(
      tryGetS3ImageDimensions({
        ...imageAsset,
        _id: 'not-an-asset-id',
      }),
    ).toBeUndefined()
    expect(
      tryGetS3VideoDimensions({
        ...videoAsset,
        _id: 'not-an-asset-id',
      }),
    ).toBeUndefined()
    expect(
      tryGetS3AssetExtension({
        ...imageAsset,
        _id: 'not-an-asset-id',
      }),
    ).toBeUndefined()
  })

  it('safe resolvers rethrow non-unresolvable parser errors', () => {
    const malformedButPatternMatchingImageId = 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'

    expect(() =>
      tryGetS3ImageDimensions({
        ...imageAsset,
        _id: malformedButPatternMatchingImageId,
        _type: 's3ImageAsset',
      }),
    ).toThrow("Malformed asset ID 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'.")

    expect(() =>
      tryGetS3AssetExtension({
        ...imageAsset,
        _id: malformedButPatternMatchingImageId,
        _type: 's3ImageAsset',
      }),
    ).toThrow("Malformed asset ID 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'.")
  })

  it('coerces valid asset IDs via getS3IdFromString', () => {
    expect(getS3IdFromString(fileId)).toBe(fileId)
    expect(getS3IdFromString(imageId)).toBe(imageId)
    expect(getS3IdFromString(videoId)).toBe(videoId)
  })

  it('coerces URLs to asset IDs via getS3IdFromString', () => {
    expect(getS3IdFromString('https://cdn.example.com/abcdefghijklmnopqrstuvwx.pdf')).toBe(fileId)
    expect(getS3IdFromString('https://cdn.example.com/abcdefghijklmnopqrstuvwx-100x200.jpg')).toBe(
      imageId,
    )
    expect(
      getS3IdFromString('https://cdn.example.com/abcdefghijklmnopqrstuvwx-1920x1080.mp4'),
    ).toBe(videoId)
  })

  it('coerces filenames to asset IDs via getS3IdFromString', () => {
    expect(getS3IdFromString('abcdefghijklmnopqrstuvwx.pdf')).toBe(fileId)
    expect(getS3IdFromString('abcdefghijklmnopqrstuvwx-100x200.jpg')).toBe(imageId)
    expect(getS3IdFromString('abcdefghijklmnopqrstuvwx-1920x1080.mp4')).toBe(videoId)
  })

  it('throws on unresolvable strings in getS3IdFromString', () => {
    expect(() => getS3IdFromString('not-resolvable')).toThrow()
    expect(() => getS3IdFromString('')).toThrow()
  })

  it('tryGetS3IdFromString returns undefined for unresolvable strings', () => {
    expect(tryGetS3IdFromString('not-resolvable')).toBeUndefined()
    expect(tryGetS3IdFromString('')).toBeUndefined()
  })

  it('identifies file, image, and video asset documents by _type', () => {
    expect(isS3FileAsset(fileAsset)).toBe(true)
    expect(isS3FileAsset(imageAsset)).toBe(false)
    expect(isS3FileAsset(videoAsset)).toBe(false)

    expect(isS3ImageAsset(imageAsset)).toBe(true)
    expect(isS3ImageAsset(fileAsset)).toBe(false)

    expect(isS3VideoAsset(videoAsset)).toBe(true)
    expect(isS3VideoAsset(imageAsset)).toBe(false)
  })
})
