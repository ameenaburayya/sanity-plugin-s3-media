import {
  getS3AssetDocumentId,
  getS3AssetExtension,
  getS3ImageDimensions,
  getS3VideoDimensions,
  isInProgressUpload,
  isS3AssetObjectStub,
  isS3FileAsset,
  isS3FileSource,
  isS3ImageAsset,
  isS3ImageSource,
  isS3VideoAsset,
  isS3VideoSource,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
  tryGetS3VideoDimensions,
} from '../resolve'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x200-jpg'
const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'

describe('resolve helpers', () => {
  it('identifies in-progress uploads and object stubs', () => {
    expect(isInProgressUpload({_upload: {stage: 'uploading'}} as any)).toBe(true)
    expect(isInProgressUpload({_upload: {}, asset: {_id: fileId}} as any)).toBe(false)
    expect(isInProgressUpload(null)).toBe(false)

    expect(isS3AssetObjectStub({asset: {_id: fileId}} as any)).toBe(true)
    expect(isS3AssetObjectStub({asset: 'not-object'} as any)).toBe(false)
    expect(isS3AssetObjectStub(undefined)).toBe(false)
  })

  it('returns placeholder for in-progress uploads', () => {
    const stub = {_upload: {}} as any
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
    const ref = {_type: 'reference', _ref: imageId} as any
    expect(getS3AssetDocumentId(ref)).toBe(imageId)

    const asset = {_id: fileId} as any
    expect(getS3AssetDocumentId(asset)).toBe(fileId)

    const objectStub = {asset} as any
    expect(getS3AssetDocumentId(objectStub)).toBe(fileId)

    const videoRef = {_type: 'reference', _ref: videoId} as any
    expect(getS3AssetDocumentId(videoRef)).toBe(videoId)
  })

  it('throws on invalid ids', () => {
    expect(() => getS3AssetDocumentId({_id: 'nope'} as any)).toThrow()
  })

  it('extracts image dimensions', () => {
    const asset = {_id: imageId} as any
    expect(getS3ImageDimensions(asset)).toEqual({
      _type: 's3ImageDimensions',
      width: 100,
      height: 200,
      aspectRatio: 0.5,
    })
  })

  it('extracts video dimensions', () => {
    const asset = {_id: videoId} as any
    expect(getS3VideoDimensions(asset)).toEqual({
      _type: 's3VideoDimensions',
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    })
  })

  it('identifies file and image sources', () => {
    expect(isS3FileSource({_id: fileId} as any)).toBe(true)
    expect(isS3FileSource({_id: imageId} as any)).toBe(false)
    expect(isS3FileSource({_id: 'invalid'} as any)).toBe(false)
    expect(isS3ImageSource({_id: imageId} as any)).toBe(true)
    expect(isS3ImageSource({_id: fileId} as any)).toBe(false)
    expect(isS3ImageSource({_id: 'invalid'} as any)).toBe(false)
    expect(isS3VideoSource({_id: videoId} as any)).toBe(true)
    expect(isS3VideoSource({_id: fileId} as any)).toBe(false)
    expect(isS3VideoSource({_id: 'invalid'} as any)).toBe(false)
  })

  it('resolves extensions and in-progress extension placeholders', () => {
    expect(getS3AssetExtension({_id: fileId} as any)).toBe('pdf')
    expect(getS3AssetExtension({_id: imageId} as any)).toBe('jpg')
    expect(getS3AssetExtension({_id: videoId} as any)).toBe('mp4')
    expect(getS3AssetExtension({_upload: {}} as any)).toBe('tmp')
  })

  it('safe resolvers return undefined for unresolvable ids', () => {
    expect(tryGetS3ImageDimensions({_id: 'not-an-asset-id'} as any)).toBeUndefined()
    expect(tryGetS3VideoDimensions({_id: 'not-an-asset-id'} as any)).toBeUndefined()
    expect(tryGetS3AssetExtension({_id: 'not-an-asset-id'} as any)).toBeUndefined()
  })

  it('safe resolvers rethrow non-unresolvable parser errors', () => {
    const malformedButPatternMatchingImageId = 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'

    expect(() => tryGetS3ImageDimensions({_id: malformedButPatternMatchingImageId} as any)).toThrow(
      "Malformed asset ID 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'.",
    )

    expect(() => tryGetS3AssetExtension({_id: malformedButPatternMatchingImageId} as any)).toThrow(
      "Malformed asset ID 's3Image-abcdefghijklmnopqrstuvwx-0x200-jpg'.",
    )
  })

  it('identifies file, image, and video asset documents by _type', () => {
    expect(isS3FileAsset({_type: 's3FileAsset'} as any)).toBe(true)
    expect(isS3FileAsset({_type: 's3ImageAsset'} as any)).toBe(false)
    expect(isS3FileAsset({_type: 's3VideoAsset'} as any)).toBe(false)

    expect(isS3ImageAsset({_type: 's3ImageAsset'} as any)).toBe(true)
    expect(isS3ImageAsset({_type: 's3FileAsset'} as any)).toBe(false)

    expect(isS3VideoAsset({_type: 's3VideoAsset'} as any)).toBe(true)
    expect(isS3VideoAsset({_type: 's3ImageAsset'} as any)).toBe(false)
  })
})
