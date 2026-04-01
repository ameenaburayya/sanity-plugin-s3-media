import type {S3AssetDocument} from 'sanity-plugin-s3-media-types'

import {UPLOADS_ACTIONS} from '../actions'

describe('UPLOADS_ACTIONS.uploadComplete', () => {
  it('creates the expected action payload', () => {
    const asset = {
      _id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg',
      _type: 's3ImageAsset',
      assetId: 'abcdefghijklmnopqrstuvwx',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      sha1hash: 'hash-1',
      size: 10,
      metadata: {
        dimensions: {
          aspectRatio: 1,
          height: 80,
          width: 120,
        },
      },
    } as unknown as S3AssetDocument

    expect(UPLOADS_ACTIONS.uploadComplete({asset})).toEqual({
      payload: {asset},
      type: 'uploads/uploadComplete',
    })
  })
})
