import {S3AssetType} from '../../../types'
import {validateAssetType} from '../validators'

describe('validateAssetType', () => {
  it('accepts supported asset types', () => {
    expect(() => validateAssetType(S3AssetType.FILE)).not.toThrow()
    expect(() => validateAssetType(S3AssetType.IMAGE)).not.toThrow()
  })

  it('throws for unsupported asset types', () => {
    expect(() => validateAssetType('video' as any)).toThrow(
      'Invalid asset type: video. Must be one of s3File, s3Image',
    )
  })
})
