import type {Action} from '@reduxjs/toolkit'
import type {StateObservable} from 'redux-observable'
import {BehaviorSubject, EMPTY, lastValueFrom, of, Subject, throwError} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {
  S3FileAsset,
  S3ImageAsset,
  S3VideoAsset,
} from 'sanity-plugin-s3-media-types'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import type {RootReducerState} from 'src/types'
import type {Mock} from 'vitest'

import {searchActions} from '../../search'
import {UPLOADS_ACTIONS} from '../../uploads/actions'
import {
  assetsActions,
  assetsDeleteEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsOrderSetEpic,
  assetsReducer,
  assetsSearchEpic,
  assetsSortEpic,
  assetsUnpickEpic,
  assetsUpdateEpic,
  selectAssetById,
  selectAssetsLength,
  selectAssetsPicked,
  selectAssetsPickedLength,
} from '../store'

const makeImageAsset = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg',
    _type: 's3ImageAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'jpg',
    metadata: {
      dimensions: {
        aspectRatio: 1.5,
        height: 80,
        width: 120,
      },
    },
    mimeType: 'image/jpeg',
    sha1hash: 'hash-image',
    size: 1024,
    _updatedAt: 1,
    ...overrides,
  }) as unknown as S3ImageAsset

const makeFileAsset = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 's3File-abcdefghijklmnopqrstuvwx-pdf',
    _type: 's3FileAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sha1hash: 'hash-file',
    size: 2048,
    _updatedAt: 2,
    ...overrides,
  }) as unknown as S3FileAsset

const makeVideoAsset = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4',
    _type: 's3VideoAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'mp4',
    metadata: {
      dimensions: {
        aspectRatio: 1920 / 1080,
        height: 1080,
        width: 1920,
      },
    },
    mimeType: 'video/mp4',
    sha1hash: 'hash-video',
    size: 4096,
    _updatedAt: 3,
    ...overrides,
  }) as unknown as S3VideoAsset

const makeRootState = (overrides: Record<string, unknown> = {}) =>
  ({
    assets: assetsReducer(undefined, {type: 'unknown'} as Action),
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
    ...overrides,
  }) as unknown as RootReducerState

type TestDeps = {
  sanityClient: {
    observable: {
      delete: Mock
      fetch: Mock
    }
    patch: Mock
  }
  s3Client: {
    observable: {
      assets: {
        deleteAsset: Mock
      }
    }
  }
}

const makeDeps = () =>
  ({
    sanityClient: {
      observable: {
        delete: vi.fn(),
        fetch: vi.fn(),
      },
      patch: vi.fn(),
    },
    s3Client: {
      observable: {
        assets: {
          deleteAsset: vi.fn(),
        },
      },
    },
  }) as unknown as TestDeps & Parameters<typeof assetsDeleteEpic>[2]

const EMPTY_STATE$ = EMPTY as unknown as StateObservable<RootReducerState>

describe('assetsReducer', () => {
  it('handles uploadComplete in extraReducers', () => {
    const asset = makeImageAsset({_id: 'asset-1'})

    const state = assetsReducer(undefined, UPLOADS_ACTIONS.uploadComplete({asset}))

    expect(state.byIds['asset-1']).toEqual({
      _type: 'asset',
      asset,
      picked: false,
      updating: false,
    })
  })

  it('handles delete request and delete error branches', () => {
    const asset1 = makeImageAsset({_id: 'asset-1'})
    const asset2 = makeImageAsset({_id: 'asset-2'})

    let state = assetsReducer(undefined, assetsActions.fetchComplete({assets: [asset1, asset2]}))

    state = assetsReducer(
      state,
      assetsActions.deleteSkipped({
        assetIds: ['asset-1'],
        reason: 'old error',
      }),
    )

    state = assetsReducer(
      state,
      assetsActions.deleteRequest({
        assets: [asset1, asset2],
      }),
    )

    expect(state.byIds['asset-1'].updating).toBe(true)
    expect(state.byIds['asset-2'].updating).toBe(true)
    expect(state.byIds['asset-1'].error).toBeUndefined()

    state = assetsReducer(
      state,
      assetsActions.deleteError({
        assetIds: ['asset-1', 'asset-2'],
        error: {
          response: {
            body: {
              error: {
                items: [{error: {description: 'Blocked by ref', id: 'asset-1'}}],
              },
            },
          },
        } as unknown as import('@sanity/client').ClientError,
      }),
    )

    expect(state.byIds['asset-1'].updating).toBe(false)
    expect(state.byIds['asset-2'].updating).toBe(false)
    expect(state.byIds['asset-1'].error).toBe('Blocked by ref')
  })

  it('handles deleteSkipped only for existing assets', () => {
    const asset = makeImageAsset({_id: 'asset-1'})

    let state = assetsReducer(undefined, assetsActions.fetchComplete({assets: [asset]}))

    state = assetsReducer(
      state,
      assetsActions.deleteSkipped({
        assetIds: ['asset-1', 'missing-id'],
        reason: 'Asset has references and cannot be deleted.',
      }),
    )

    expect(state.byIds['asset-1'].updating).toBe(false)
    expect(state.byIds['asset-1'].error).toBe('Asset has references and cannot be deleted.')
    expect(state.byIds['missing-id']).toBeUndefined()
  })

  it('handles fetchComplete dedupe and deleteComplete paging update', () => {
    const asset1 = makeImageAsset({_id: 'asset-1'})
    const asset2 = makeImageAsset({_id: 'asset-2'})
    const asset3 = makeImageAsset({_id: 'asset-3'})

    let state = assetsReducer(
      undefined,
      assetsActions.fetchError({message: 'boom', statusCode: 500}),
    )

    state = assetsReducer(
      state,
      assetsActions.fetchComplete({assets: [asset1, asset2, asset1, asset3]}),
    )

    expect(state.allIds).toEqual(['asset-1', 'asset-2', 'asset-3'])
    expect(state.fetchCount).toBe(4)
    expect(state.fetchingError).toBeUndefined()

    state = assetsReducer(
      {...state, pageSize: 2},
      assetsActions.deleteComplete({assetIds: ['asset-1']}),
    )

    expect(state.allIds).toEqual(['asset-2', 'asset-3'])
    expect(state.byIds['asset-1']).toBeUndefined()
    expect(state.pageIndex).toBe(0)
  })

  it('supports pickRange, pickClear, and sorting', () => {
    const asset1 = makeImageAsset({_id: 'asset-1', size: 3})
    const asset2 = makeImageAsset({_id: 'asset-2', size: 1})
    const asset3 = makeImageAsset({_id: 'asset-3', size: 2})

    let state = assetsReducer(
      undefined,
      assetsActions.fetchComplete({assets: [asset1, asset2, asset3]}),
    )

    state = assetsReducer(state, assetsActions.pickRange({endId: 'asset-3', startId: 'asset-1'}))

    expect(state.byIds['asset-1'].picked).toBe(true)
    expect(state.byIds['asset-2'].picked).toBe(true)
    expect(state.byIds['asset-3'].picked).toBe(true)
    expect(state.lastPicked).toBe('asset-3')

    state = assetsReducer(
      state,
      assetsActions.orderSet({
        order: {direction: 'asc', field: 'size'},
      }),
    )
    state = assetsReducer(state, assetsActions.sort())

    expect(state.allIds).toEqual(['asset-2', 'asset-3', 'asset-1'])

    state = assetsReducer(state, assetsActions.pickClear())

    expect(state.lastPicked).toBeUndefined()
    expect(state.byIds['asset-1'].picked).toBe(false)
    expect(state.byIds['asset-2'].picked).toBe(false)
    expect(state.byIds['asset-3'].picked).toBe(false)
  })

  it('handles clear, fetchRequest reducer/prepare variants, and fetchComplete fallbacks', () => {
    const asset = makeImageAsset({_id: 'asset-1'})

    const requestDefault = assetsActions.fetchRequest({
      queryFilter: '_type in ["s3ImageAsset"]',
    })
    const requestNoPipe = assetsActions.fetchRequest({
      queryFilter: '_type in ["s3ImageAsset"]',
      selector: '',
      sort: '',
    })
    const requestSelectorOnly = assetsActions.fetchRequest({
      queryFilter: '_type in ["s3ImageAsset"]',
      selector: '[0]',
      sort: '',
    })

    expect(requestDefault.payload.params).toEqual({})
    expect(requestDefault.payload.query).toContain('|')
    expect(requestNoPipe.payload.query).not.toContain('|')
    expect(requestSelectorOnly.payload.query).toContain('|')

    let state = assetsReducer(undefined, assetsActions.fetchComplete({assets: [asset]}))

    state = assetsReducer(
      {...state, fetchingError: {message: 'oops', statusCode: 500}},
      requestDefault,
    )

    expect(state.fetching).toBe(true)
    expect(state.fetchingError).toBeUndefined()

    state = assetsReducer(state, {payload: {assets: []}, type: assetsActions.fetchComplete.type})
    expect(state.fetchCount).toBe(0)

    state = assetsReducer(state, assetsActions.fetchComplete({assets: []}))
    expect(state.fetchCount).toBe(0)

    state = assetsReducer(state, assetsActions.clear())
    expect(state.allIds).toEqual([])
  })

  it('handles insert/listener/paging/update/view/pickAll reducers and sort desc/equal branches', () => {
    const asset1 = makeImageAsset({_id: 'asset-1', size: 1})
    const asset2 = makeImageAsset({_id: 'asset-2', size: 3})
    const asset3 = makeImageAsset({_id: 'asset-3', size: 3})
    const asset1Updated = makeImageAsset({_id: 'asset-1', size: 10, title: 'Updated'})

    let state = assetsReducer(
      undefined,
      assetsActions.fetchComplete({assets: [asset1, asset2, asset3]}),
    )

    state = assetsReducer(state, assetsActions.insertUploads({results: {'hash-1': 'asset-4'}}))
    expect(state.allIds).toContain('asset-4')

    const duplicateState = assetsReducer(
      {...state, allIds: ['hash-1']},
      assetsActions.insertUploads({results: {'hash-1': 'asset-5'}}),
    )

    expect(duplicateState.allIds).toEqual(['hash-1'])

    state = assetsReducer(
      undefined,
      assetsActions.fetchComplete({assets: [asset1, asset2, asset3]}),
    )

    state = assetsReducer(state, assetsActions.listenerCreateQueue({asset: asset1}))
    state = assetsReducer(
      state,
      assetsActions.listenerCreateQueueComplete({
        assets: [asset1Updated, makeImageAsset({_id: 'missing-asset'})],
      }),
    )
    expect(state.byIds['asset-1'].asset.title).toBe('Updated')
    expect(state.byIds['missing-asset']).toBeUndefined()

    state = assetsReducer(state, assetsActions.listenerUpdateQueue({asset: asset1}))
    state = assetsReducer(
      state,
      assetsActions.listenerUpdateQueueComplete({
        assets: [makeImageAsset({_id: 'asset-1', size: 11})],
      }),
    )
    expect(state.byIds['asset-1'].asset.size).toBe(11)

    state = assetsReducer(state, assetsActions.listenerDeleteQueue({assetId: 'asset-1'}))
    state = assetsReducer(
      state,
      assetsActions.listenerDeleteQueueComplete({assetIds: ['asset-1', 'unknown']}),
    )
    expect(state.byIds['asset-1']).toBeUndefined()

    state = assetsReducer(state, assetsActions.loadNextPage())
    state = assetsReducer(state, assetsActions.loadPageIndex({pageIndex: 7}))
    expect(state.pageIndex).toBe(7)

    state = assetsReducer(state, assetsActions.pickAll())
    expect(Object.values(state.byIds).every((item) => item.picked)).toBe(true)

    state = assetsReducer(state, assetsActions.pick({assetId: 'asset-2', picked: false}))
    expect(state.lastPicked).toBeUndefined()
    expect(state.byIds['asset-2'].picked).toBe(false)

    state = assetsReducer(
      state,
      assetsActions.updateRequest({
        asset: makeImageAsset({_id: 'asset-2'}),
        formData: {title: 'Draft'},
      }),
    )
    expect(state.byIds['asset-2'].updating).toBe(true)

    state = assetsReducer(
      state,
      assetsActions.updateError({
        asset: makeImageAsset({_id: 'asset-2'}),
        error: {message: 'Cannot update', statusCode: 400},
      }),
    )
    expect(state.byIds['asset-2'].updating).toBe(false)
    expect(state.byIds['asset-2'].error).toBe('Cannot update')

    state = assetsReducer(
      state,
      assetsActions.updateComplete({
        asset: makeImageAsset({_id: 'asset-2', title: 'Saved'}),
      }),
    )
    expect(state.byIds['asset-2'].asset.title).toBe('Saved')
    expect(state.byIds['asset-2'].updating).toBe(false)

    state = assetsReducer(state, assetsActions.viewSet({view: 'table'}))
    expect(state.view).toBe('table')

    state = assetsReducer(
      state,
      assetsActions.orderSet({order: {direction: 'desc', field: 'size'}}),
    )
    state = assetsReducer(state, assetsActions.sort())
    expect(state.allIds).toEqual(['asset-2', 'asset-3'])
  })

  it('returns stable order when sort field values are equal', () => {
    const asset1 = makeImageAsset({_id: 'asset-1', size: 5})
    const asset2 = makeImageAsset({_id: 'asset-2', size: 5})

    let state = assetsReducer(undefined, assetsActions.fetchComplete({assets: [asset1, asset2]}))

    state = assetsReducer(
      state,
      assetsActions.orderSet({order: {direction: 'asc', field: 'size'}}),
    )
    state = assetsReducer(state, assetsActions.sort())

    expect(state.allIds).toEqual(['asset-1', 'asset-2'])
  })
})

describe('assets selectors', () => {
  it('returns asset selection helpers', () => {
    const asset1 = makeImageAsset({_id: 'asset-1'})
    const asset2 = makeImageAsset({_id: 'asset-2'})

    let assetsState = assetsReducer(
      undefined,
      assetsActions.fetchComplete({assets: [asset1, asset2]}),
    )

    assetsState = assetsReducer(assetsState, assetsActions.pick({assetId: 'asset-2', picked: true}))

    const state = makeRootState({assets: assetsState})

    expect(selectAssetById(state, 'asset-1')?.asset._id).toBe('asset-1')
    expect(selectAssetById(state, 'missing')).toBeUndefined()
    expect(selectAssetsLength(state)).toBe(2)
    expect(selectAssetsPicked(state).map((item) => item.asset._id)).toEqual(['asset-2'])
    expect(selectAssetsPickedLength(state)).toBe(1)
  })
})

describe('assets epics', () => {
  it('assetsDeleteEpic deletes image assets by computed image path', async () => {
    const imageAsset = makeImageAsset({_id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg'})
    const deps = makeDeps()

    deps.sanityClient.observable.fetch.mockReturnValue(
      of([{_id: imageAsset._id, referenceCount: 0}]),
    )
    deps.s3Client.observable.assets.deleteAsset.mockReturnValue(of({ok: true}))
    deps.sanityClient.observable.delete.mockReturnValue(of({ok: true}))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [imageAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(deps.s3Client.observable.assets.deleteAsset).toHaveBeenCalledWith({
      fileName: 'abcdefghijklmnopqrstuvwx-120x80.jpg',
    })
    expect(result).toEqual([assetsActions.deleteComplete({assetIds: [imageAsset._id]})])
  })

  it('assetsDeleteEpic deletes video assets by computed video path', async () => {
    const videoAsset = makeVideoAsset({_id: 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'})
    const deps = makeDeps()

    deps.sanityClient.observable.fetch.mockReturnValue(
      of([{_id: videoAsset._id, referenceCount: 0}]),
    )
    deps.s3Client.observable.assets.deleteAsset.mockReturnValue(of({ok: true}))
    deps.sanityClient.observable.delete.mockReturnValue(of({ok: true}))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [videoAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(deps.s3Client.observable.assets.deleteAsset).toHaveBeenCalledWith({
      fileName: 'abcdefghijklmnopqrstuvwx-1920x1080.mp4',
    })
    expect(result).toEqual([assetsActions.deleteComplete({assetIds: [videoAsset._id]})])
  })

  it('assetsDeleteEpic emits skipped and complete when only some are deletable', async () => {
    const blockedAsset = makeImageAsset({_id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg'})
    const deletableAsset = makeFileAsset({_id: 's3File-abcdefghijklmnopqrstuvwx-pdf'})

    const deps = makeDeps()

    deps.sanityClient.observable.fetch.mockReturnValue(
      of([
        {_id: blockedAsset._id, referenceCount: 2},
        {_id: deletableAsset._id, referenceCount: 0},
      ]),
    )
    deps.s3Client.observable.assets.deleteAsset.mockReturnValue(of({ok: true}))
    deps.sanityClient.observable.delete.mockReturnValue(of({ok: true}))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [blockedAsset, deletableAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(deps.s3Client.observable.assets.deleteAsset).toHaveBeenCalledWith({
      fileName: 'abcdefghijklmnopqrstuvwx.pdf',
    })
    expect(result).toEqual([
      assetsActions.deleteSkipped({
        assetIds: [blockedAsset._id],
        reason: 'Asset has references and cannot be deleted.',
      }),
      assetsActions.deleteComplete({assetIds: [deletableAsset._id]}),
    ])
  })

  it('assetsDeleteEpic emits skipped only when all assets are blocked', async () => {
    const blockedAsset = makeImageAsset({_id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg'})

    const deps = makeDeps()

    deps.sanityClient.observable.fetch.mockReturnValue(
      of([{_id: blockedAsset._id, referenceCount: 1}]),
    )

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [blockedAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(deps.s3Client.observable.assets.deleteAsset).not.toHaveBeenCalled()
    expect(result).toEqual([
      assetsActions.deleteSkipped({
        assetIds: [blockedAsset._id],
        reason: 'Asset has references and cannot be deleted.',
      }),
    ])
  })

  it('assetsDeleteEpic maps reference lookup errors to deleteError', async () => {
    const asset = makeImageAsset({_id: 'asset-1'})
    const deps = makeDeps()
    const error = {message: 'lookup failed', statusCode: 500} as unknown as import('@sanity/client').ClientError

    deps.sanityClient.observable.fetch.mockReturnValue(throwError(() => error))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [asset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.deleteError({assetIds: ['asset-1'], error})])
  })

  it('assetsDeleteEpic maps delete flow failures to deleteError for deletable ids', async () => {
    const deletableAsset = makeFileAsset({_id: 's3File-abcdefghijklmnopqrstuvwx-pdf'})

    const deps = makeDeps()
    const error = {message: 'delete failed', statusCode: 500} as unknown as import('@sanity/client').ClientError

    deps.sanityClient.observable.fetch.mockReturnValue(
      of([{_id: deletableAsset._id, referenceCount: 0}]),
    )
    deps.s3Client.observable.assets.deleteAsset.mockReturnValue(throwError(() => error))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [deletableAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      assetsActions.deleteError({
        assetIds: [deletableAsset._id],
        error,
      }),
    ])
  })

  it('assetsDeleteEpic maps unsupported asset types to deleteError', async () => {
    const deps = makeDeps()
    const badAsset = {
      _id: 'asset-unknown',
      _type: 'unsupportedAsset',
    } as unknown as ReturnType<typeof assetsActions.deleteRequest>['payload']['assets'][number]

    deps.sanityClient.observable.fetch.mockReturnValue(of([{_id: badAsset._id, referenceCount: 0}]))

    const result = await lastValueFrom(
      assetsDeleteEpic(
        of(assetsActions.deleteRequest({assets: [badAsset]})),
        EMPTY_STATE$,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toHaveLength(1)
    const deleteErrorAction = result[0] as ReturnType<typeof assetsActions.deleteError>

    expect(deleteErrorAction.type).toBe(assetsActions.deleteError.type)
    expect(deleteErrorAction.payload.assetIds).toEqual(['asset-unknown'])
    expect(deleteErrorAction.payload.error.message).toBe('Unsupported asset type')
  })

  it('assetsFetchEpic emits fetchComplete and fetchError branches', async () => {
    const deps = makeDeps()

    deps.sanityClient.observable.fetch.mockReturnValueOnce(
      of({
        items: [makeImageAsset({_id: 'asset-1'})],
      }),
    )

    let result = await lastValueFrom(
      assetsFetchEpic(
        of(assetsActions.fetchRequest({queryFilter: '_type in ["s3ImageAsset"]'})),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      assetsActions.fetchComplete({assets: [makeImageAsset({_id: 'asset-1'})]}),
    ])

    deps.sanityClient.observable.fetch.mockReturnValueOnce(
      throwError(() => ({message: 'fetch failed', statusCode: 503})),
    )

    result = await lastValueFrom(
      assetsFetchEpic(
        of(assetsActions.fetchRequest({queryFilter: '_type in ["s3ImageAsset"]'})),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.fetchError({message: 'fetch failed', statusCode: 503})])

    deps.sanityClient.observable.fetch.mockReturnValueOnce(throwError(() => ({})))

    result = await lastValueFrom(
      assetsFetchEpic(
        of(assetsActions.fetchRequest({queryFilter: '_type in ["s3ImageAsset"]'})),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.fetchError({message: 'Internal error', statusCode: 500})])
  })

  it('assetsFetchPageIndexEpic and assetsFetchNextPageEpic derive next fetch actions from state', async () => {
    const state = makeRootState({
      assets: {
        ...assetsReducer(undefined, {type: 'unknown'} as Action),
        assetTypes: [S3AssetType.IMAGE],
        order: {
          direction: 'asc',
          field: 'size',
        },
        pageSize: 100,
      },
      search: {query: 'cat'},
      selected: {
        assets: [],
        document: {_id: 'doc-1'},
        documentAssetIds: ['asset-1'],
      },
    })

    const pageResult = await lastValueFrom(
      assetsFetchPageIndexEpic(
        of(assetsActions.loadPageIndex({pageIndex: 2})),
        new BehaviorSubject(state) as unknown as StateObservable<RootReducerState>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(pageResult).toHaveLength(1)
    const fetchPageAction = pageResult[0] as ReturnType<typeof assetsActions.fetchRequest>

    expect(fetchPageAction.type).toBe(assetsActions.fetchRequest.type)
    expect(fetchPageAction.payload.params).toEqual({
      documentAssetIds: ['asset-1'],
      documentId: 'doc-1',
    })
    expect(fetchPageAction.payload.query).toContain('[200...300]')

    const nextPageResult = await lastValueFrom(
      assetsFetchNextPageEpic(
        of(assetsActions.loadNextPage()),
        new BehaviorSubject(
          makeRootState({
            assets: {
              ...assetsReducer(undefined, {type: 'unknown'} as Action),
              pageIndex: 3,
            },
          }),
        ) as unknown as StateObservable<RootReducerState>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(nextPageResult).toEqual([assetsActions.loadPageIndex({pageIndex: 4})])
  })

  it('assetsFetchPageIndexEpic omits documentId when it is missing', async () => {
    const state = makeRootState({
      assets: {
        ...assetsReducer(undefined, {type: 'unknown'} as Action),
        pageSize: 10,
      },
      selected: {
        assets: [],
        document: undefined,
        documentAssetIds: ['asset-1'],
      },
    })

    const result = await lastValueFrom(
      assetsFetchPageIndexEpic(
        of(assetsActions.loadPageIndex({pageIndex: 1})),
        new BehaviorSubject(state) as unknown as StateObservable<RootReducerState>,
        makeDeps(),
      ).pipe(toArray()),
    )

    const fetchPageAction = result[0] as ReturnType<typeof assetsActions.fetchRequest>

    expect(fetchPageAction.payload.params).toEqual({
      documentAssetIds: ['asset-1'],
    })
    expect(fetchPageAction.payload.params.documentId).toBeUndefined()
  })

  it('assetsFetchAfterDeleteAllEpic emits only when current page is empty', async () => {
    let result = await lastValueFrom(
      assetsFetchAfterDeleteAllEpic(
        of(assetsActions.deleteComplete({assetIds: ['asset-1']})),
        new BehaviorSubject(
          makeRootState({
            assets: {
              ...assetsReducer(undefined, {type: 'unknown'} as Action),
              allIds: [],
              pageSize: 50,
            },
          }),
        ) as unknown as StateObservable<RootReducerState>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.loadPageIndex({pageIndex: 0})])

    result = await lastValueFrom(
      assetsFetchAfterDeleteAllEpic(
        of(assetsActions.deleteComplete({assetIds: ['asset-1']})),
        new BehaviorSubject(
          makeRootState({
            assets: {
              ...assetsReducer(undefined, {type: 'unknown'} as Action),
              allIds: ['asset-2'],
              pageSize: 50,
            },
          }),
        ) as unknown as StateObservable<RootReducerState>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([])
  })

  it('assetsOrderSetEpic and assetsSortEpic emit expected follow-up actions', async () => {
    let result = await lastValueFrom(
      assetsOrderSetEpic(
        of(assetsActions.orderSet({order: {direction: 'desc', field: '_updatedAt'}})),
        EMPTY_STATE$,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.clear(), assetsActions.loadPageIndex({pageIndex: 0})])

    result = await lastValueFrom(
      assetsSortEpic(
        of(assetsActions.insertUploads({results: {'hash-1': 'asset-1'}})),
        EMPTY_STATE$,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([assetsActions.sort()])
  })

  it('assetsSearchEpic debounces before emitting clear and page reset', async () => {
    vi.useFakeTimers()

    const action$ = new Subject<Action>()
    const emitted: Action[] = []

    assetsSearchEpic(action$, EMPTY_STATE$, makeDeps()).subscribe((action) => {
      emitted.push(action)
    })

    action$.next(searchActions.querySet({searchQuery: 'kittens'}))

    expect(emitted).toEqual([])

    await vi.advanceTimersByTimeAsync(399)
    expect(emitted).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(emitted).toEqual([assetsActions.clear(), assetsActions.loadPageIndex({pageIndex: 0})])

    action$.complete()
  })

  it('listener queue epics batch events and skip empty queues', async () => {
    vi.useFakeTimers()

    const action$ = new Subject<Action>()

    const createResultPromise = lastValueFrom(
      assetsListenerCreateQueueEpic(action$, EMPTY_STATE$, makeDeps()).pipe(toArray()),
    )
    const deleteResultPromise = lastValueFrom(
      assetsListenerDeleteQueueEpic(action$, EMPTY_STATE$, makeDeps()).pipe(toArray()),
    )
    const updateResultPromise = lastValueFrom(
      assetsListenerUpdateQueueEpic(action$, EMPTY_STATE$, makeDeps()).pipe(toArray()),
    )

    action$.next(assetsActions.listenerCreateQueue({asset: makeImageAsset({_id: 'asset-1'})}))
    action$.next(assetsActions.listenerCreateQueue({asset: makeImageAsset({_id: 'asset-2'})}))
    action$.next(assetsActions.listenerDeleteQueue({assetId: 'asset-1'}))
    action$.next(assetsActions.listenerUpdateQueue({asset: makeImageAsset({_id: 'asset-3'})}))

    await vi.advanceTimersByTimeAsync(2000)

    action$.complete()

    const createResult = await createResultPromise
    const deleteResult = await deleteResultPromise
    const updateResult = await updateResultPromise

    expect(createResult).toEqual([
      assetsActions.listenerCreateQueueComplete({
        assets: [makeImageAsset({_id: 'asset-1'}), makeImageAsset({_id: 'asset-2'})],
      }),
    ])

    expect(deleteResult).toEqual([
      assetsActions.listenerDeleteQueueComplete({
        assetIds: ['asset-1'],
      }),
    ])

    expect(updateResult).toEqual([
      assetsActions.listenerUpdateQueueComplete({
        assets: [makeImageAsset({_id: 'asset-3'})],
      }),
    ])

    const emptyResult = await lastValueFrom(
      assetsListenerCreateQueueEpic(EMPTY, EMPTY_STATE$, makeDeps()).pipe(toArray()),
    )

    expect(emptyResult).toEqual([])
  })

  it('assetsUnpickEpic emits pickClear for order, view, and search actions', async () => {
    const result = await lastValueFrom(
      assetsUnpickEpic(
        of(
          assetsActions.viewSet({view: 'table'}),
          assetsActions.orderSet({order: {direction: 'asc', field: '_updatedAt'}}),
          searchActions.querySet({searchQuery: 'cat'}),
        ),
        EMPTY_STATE$,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      assetsActions.pickClear(),
      assetsActions.pickClear(),
      assetsActions.pickClear(),
    ])
  })

  it('assetsUpdateEpic emits updateComplete and updateError branches', async () => {
    const asset = makeImageAsset({_id: 'asset-1'})
    const updatedAsset = makeImageAsset({_id: 'asset-1', title: 'Updated'})

    const successDeps = makeDeps()
    const successPatch = {
      commit: vi.fn().mockResolvedValue(updatedAsset),
      set: vi.fn().mockReturnThis(),
      setIfMissing: vi.fn().mockReturnThis(),
    }

    successDeps.sanityClient.patch.mockReturnValue(successPatch)

    let result = await lastValueFrom(
      assetsUpdateEpic(
        of(
          assetsActions.updateRequest({
            asset,
            closeDialogId: 'dialog-1',
            formData: {title: 'Updated'},
          }),
        ),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        successDeps,
      ).pipe(toArray()),
    )

    expect(successDeps.sanityClient.patch).toHaveBeenCalledWith('asset-1')
    expect(successPatch.setIfMissing).toHaveBeenCalledTimes(2)
    expect(successPatch.set).toHaveBeenCalledWith({title: 'Updated'})

    expect(result).toEqual([
      assetsActions.updateComplete({asset: updatedAsset, closeDialogId: 'dialog-1'}),
    ])

    const errorDeps = makeDeps()
    const errorPatch = {
      commit: vi.fn().mockRejectedValue({message: 'Patch failed', statusCode: 400}),
      set: vi.fn().mockReturnThis(),
      setIfMissing: vi.fn().mockReturnThis(),
    }

    errorDeps.sanityClient.patch.mockReturnValue(errorPatch)

    result = await lastValueFrom(
      assetsUpdateEpic(
        of(
          assetsActions.updateRequest({
            asset,
            formData: {title: 'Updated'},
          }),
        ),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        errorDeps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      assetsActions.updateError({
        asset,
        error: {
          message: 'Patch failed',
          statusCode: 400,
        },
      }),
    ])

    const defaultErrorDeps = makeDeps()
    const defaultErrorPatch = {
      commit: vi.fn().mockRejectedValue({}),
      set: vi.fn().mockReturnThis(),
      setIfMissing: vi.fn().mockReturnThis(),
    }

    defaultErrorDeps.sanityClient.patch.mockReturnValue(defaultErrorPatch)

    result = await lastValueFrom(
      assetsUpdateEpic(
        of(
          assetsActions.updateRequest({
            asset,
            formData: {title: 'Updated'},
          }),
        ),
        new BehaviorSubject(makeRootState()) as unknown as StateObservable<RootReducerState>,
        defaultErrorDeps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      assetsActions.updateError({
        asset,
        error: {
          message: 'Internal error',
          statusCode: 500,
        },
      }),
    ])
  })
})
