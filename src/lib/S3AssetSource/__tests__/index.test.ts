import {uploadS3Asset as uploadS3AssetDirect} from '../assets'
import {uploadS3Asset} from '../index'

describe('S3AssetSource index exports', () => {
  it('re-exports upload helpers', () => {
    expect(uploadS3Asset).toBe(uploadS3AssetDirect)
  })
})
