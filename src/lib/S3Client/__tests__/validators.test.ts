import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {validateAssetType} from '../validators'

describe('validateAssetType', () => {
  it('accepts supported asset types', () => {
    expect(() => validateAssetType(S3AssetType.FILE)).not.toThrow()
    expect(() => validateAssetType(S3AssetType.IMAGE)).not.toThrow()
    expect(() => validateAssetType(S3AssetType.VIDEO)).not.toThrow()
  })

  it('throws for unsupported asset types', () => {
    expect(() => validateAssetType('video' as never)).toThrow(
      'Invalid asset type: video. Must be one of s3File, s3Image, s3Video',
    )
  })
})
