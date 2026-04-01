import {S3AssetType} from '../asset'

describe('S3AssetType', () => {
  it('exports stable enum values', () => {
    expect(S3AssetType.FILE).toBe('s3File')
    expect(S3AssetType.IMAGE).toBe('s3Image')
    expect(S3AssetType.VIDEO).toBe('s3Video')
  })

  it('exports the complete enum shape', () => {
    expect(S3AssetType).toEqual({
      FILE: 's3File',
      IMAGE: 's3Image',
      VIDEO: 's3Video',
    })
  })
})
