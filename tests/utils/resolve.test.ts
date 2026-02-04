import {describe, expect, it} from 'vitest'

import {
  getS3AssetDocumentId,
  getS3ImageDimensions,
  isS3FileSource,
  isS3ImageSource,
} from '../../src/utils/resolve'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x200-jpg'

describe('resolve helpers', () => {
  it('returns placeholder for in-progress uploads', () => {
    const stub = {_upload: {}} as any
    expect(getS3AssetDocumentId(stub)).toBe('upload-in-progress-placeholder')
    expect(getS3ImageDimensions(stub)).toEqual({
      _type: 's3ImageDimensions',
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

  it('identifies file and image sources', () => {
    expect(isS3FileSource({_id: fileId} as any)).toBe(true)
    expect(isS3FileSource({_id: imageId} as any)).toBe(false)
    expect(isS3ImageSource({_id: imageId} as any)).toBe(true)
    expect(isS3ImageSource({_id: fileId} as any)).toBe(false)
  })
})
