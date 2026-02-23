import {s3File, s3FileAsset, s3Image, s3ImageAsset} from '../index'

vi.mock('../s3File', () => ({
  s3File: {name: 's3File'},
}))

vi.mock('../s3FileAsset', () => ({
  s3FileAsset: {name: 's3FileAsset'},
}))

vi.mock('../s3Image', () => ({
  s3Image: {name: 's3Image'},
}))

vi.mock('../s3ImageAsset', () => ({
  s3ImageAsset: {name: 's3ImageAsset'},
}))

describe('schema index exports', () => {
  it('re-exports all schema definitions', () => {
    expect(s3File).toEqual({name: 's3File'})
    expect(s3FileAsset).toEqual({name: 's3FileAsset'})
    expect(s3Image).toEqual({name: 's3Image'})
    expect(s3ImageAsset).toEqual({name: 's3ImageAsset'})
  })
})
