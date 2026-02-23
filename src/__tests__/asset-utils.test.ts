import {
  buildS3FileUrl as buildS3FileUrlExport,
  buildS3ImageUrl as buildS3ImageUrlExport,
  getS3AssetExtension as getS3AssetExtensionExport,
  getS3ImageDimensions as getS3ImageDimensionsExport,
  tryGetS3AssetExtension as tryGetS3AssetExtensionExport,
  tryGetS3ImageDimensions as tryGetS3ImageDimensionsExport,
} from '../asset-utils'

const {
  buildS3FileUrl,
  buildS3ImageUrl,
  getS3AssetExtension,
  getS3ImageDimensions,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
} = vi.hoisted(() => ({
  buildS3FileUrl: vi.fn(() => 'file-url'),
  buildS3ImageUrl: vi.fn(() => 'image-url'),
  getS3AssetExtension: vi.fn(() => 'png'),
  getS3ImageDimensions: vi.fn(() => ({width: 100, height: 50, aspectRatio: 2})),
  tryGetS3AssetExtension: vi.fn(() => undefined),
  tryGetS3ImageDimensions: vi.fn(() => undefined),
}))

vi.mock('../utils/asset/paths', () => ({
  buildS3FileUrl,
  buildS3ImageUrl,
}))

vi.mock('../utils/resolve', () => ({
  getS3AssetExtension,
  getS3ImageDimensions,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
}))

describe('asset-utils exports', () => {
  it('re-exports path and resolve helpers', () => {
    expect(buildS3FileUrlExport).toBe(buildS3FileUrl)
    expect(buildS3ImageUrlExport).toBe(buildS3ImageUrl)
    expect(getS3AssetExtensionExport).toBe(getS3AssetExtension)
    expect(getS3ImageDimensionsExport).toBe(getS3ImageDimensions)
    expect(tryGetS3AssetExtensionExport).toBe(tryGetS3AssetExtension)
    expect(tryGetS3ImageDimensionsExport).toBe(tryGetS3ImageDimensions)
  })

  it('keeps mocked runtime behavior', () => {
    expect(buildS3FileUrlExport('id', {baseUrl: 'x'})).toBe('file-url')
    expect(buildS3ImageUrlExport('id', {baseUrl: 'x'})).toBe('image-url')
    expect(getS3AssetExtensionExport({} as any)).toBe('png')
    expect(getS3ImageDimensionsExport({} as any)).toEqual({width: 100, height: 50, aspectRatio: 2})
    expect(tryGetS3AssetExtensionExport({} as any)).toBeUndefined()
    expect(tryGetS3ImageDimensionsExport({} as any)).toBeUndefined()
  })
})
