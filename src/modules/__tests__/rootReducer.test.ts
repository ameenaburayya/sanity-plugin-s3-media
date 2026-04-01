import type {S3Asset} from 'sanity-plugin-s3-media-types'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import type {UploadItem} from 'src/types'

import {assetsActions} from '../assets'
import {rootReducer} from '../rootReducer'
import {searchActions} from '../search'
import {uploadsActions} from '../uploads'

describe('rootReducer', () => {
  it('returns full initial state shape', () => {
    const state = rootReducer(undefined, {type: 'unknown'})

    expect(state).toEqual({
      assets: expect.any(Object),
      dialog: {items: []},
      notifications: {items: []},
      search: {query: ''},
      selected: {
        assets: [],
        document: undefined,
        documentAssetIds: [],
      },
      uploads: {
        allIds: [],
        byIds: {},
      },
    })
  })

  it('delegates to nested reducers', () => {
    let state = rootReducer(undefined, {type: 'unknown'})

    state = rootReducer(state, searchActions.querySet({searchQuery: 'kittens'}))
    expect(state.search.query).toBe('kittens')

    state = rootReducer(
      state,
      uploadsActions.uploadStart({
        file: new File(['a'], 'a.jpg', {type: 'image/jpeg'}),
        uploadItem: {
          _type: 'upload',
          assetType: S3AssetType.IMAGE,
          hash: 'hash-1',
          name: 'a.jpg',
          size: 10,
          status: 'queued',
        } satisfies UploadItem,
      }),
    )

    expect(state.uploads.allIds).toEqual(['hash-1'])
    expect(state.uploads.byIds['hash-1']).toBeDefined()

    state = rootReducer(
      state,
      assetsActions.fetchComplete({
        assets: [
          {
            _id: 's3File-abcdefghijklmnopqrstuvwx-pdf',
            _type: 's3FileAsset',
            assetId: 'abcdefghijklmnopqrstuvwx',
            extension: 'pdf',
            mimeType: 'application/pdf',
            sha1hash: 'hash-2',
            size: 20,
          } as unknown as S3Asset,
        ],
      }),
    )

    expect(state.assets.allIds).toContain('s3File-abcdefghijklmnopqrstuvwx-pdf')
  })
})
