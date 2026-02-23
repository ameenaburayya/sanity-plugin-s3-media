import {assetsActions} from '../assets'
import {rootReducer} from '../rootReducer'
import {searchActions} from '../search'
import {uploadsActions} from '../uploads'

describe('rootReducer', () => {
  it('returns full initial state shape', () => {
    const state = rootReducer(undefined, {type: 'unknown'} as any)

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
    let state = rootReducer(undefined, {type: 'unknown'} as any)

    state = rootReducer(state, searchActions.querySet({searchQuery: 'kittens'}))
    expect(state.search.query).toBe('kittens')

    state = rootReducer(
      state,
      uploadsActions.uploadStart({
        file: {name: 'a.jpg', size: 10} as any,
        uploadItem: {
          _type: 'upload',
          assetType: 's3Image',
          hash: 'hash-1',
          name: 'a.jpg',
          size: 10,
          status: 'queued',
        } as any,
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
          },
        ] as any,
      }),
    )

    expect(state.assets.allIds).toContain('s3File-abcdefghijklmnopqrstuvwx-pdf')
  })
})
