import {createSelector, createSlice, type PayloadAction} from '@reduxjs/toolkit'
import type {ClientError} from '@sanity/client'
import groq from 'groq'
import type {Selector} from 'react-redux'
import {ofType} from 'redux-observable'
import {EMPTY, concat, forkJoin, from, of} from 'rxjs'
import {
  bufferTime,
  catchError,
  debounceTime,
  filter,
  mergeMap,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'

import {getOrderTitle} from '../../config/orders'
import {ORDER_OPTIONS} from '../../constants'
import type {AssetItem, BrowserView, HttpError, Epic, Order} from '../../types'
import {
  buildS3FilePath,
  buildS3ImagePath,
  constructFilter,
  isS3FileAsset,
  isS3ImageAsset,
} from '../../utils'
import {searchActions} from '../search'
import type {RootReducerState, S3Asset, S3AssetType} from '../../types'
import {UPLOADS_ACTIONS} from '../uploads/actions'

type ItemError = {
  description: string
  id: string
  referencingIDs: string[]
  type: string // 'documentHasExistingReferencesError'
}

const buildFileName = (asset: S3Asset): string => {
  if (isS3ImageAsset(asset)) {
    return buildS3ImagePath(asset._id)
  }

  if (isS3FileAsset(asset)) {
    return buildS3FilePath(asset._id)
  }

  throw new Error('Unsupported asset type')
}

type AssetsReducerState = {
  allIds: string[]
  assetTypes: S3AssetType[]
  byIds: Record<string, AssetItem>
  fetchCount: number
  fetching: boolean
  fetchingError?: HttpError
  lastPicked?: string
  order: Order
  pageIndex: number
  pageSize: number
  view: BrowserView
  // totalCount: number
}

const defaultOrder = ORDER_OPTIONS[0] as Order

export const initialState = {
  allIds: [],
  assetTypes: [],
  byIds: {},
  fetchCount: -1,
  fetching: false,
  fetchingError: undefined,
  lastPicked: undefined,
  order: {
    direction: defaultOrder.direction,
    field: defaultOrder.field,
    title: getOrderTitle(defaultOrder),
  },
  pageIndex: 0,
  pageSize: 100,
  // totalCount: -1,
  view: 'grid',
} as AssetsReducerState

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  extraReducers: (builder) => {
    builder //
      .addCase(UPLOADS_ACTIONS.uploadComplete, (state, action) => {
        const {asset} = action.payload

        state.byIds[asset._id] = {
          _type: 'asset',
          asset: asset as S3Asset,
          picked: false,
          updating: false,
        }
      })
  },
  reducers: {
    // Clear asset order
    clear(state) {
      state.allIds = []
    },
    // Remove assets and update page index
    deleteComplete(state, action: PayloadAction<{assetIds: string[]}>) {
      const {assetIds} = action.payload

      assetIds?.forEach((id) => {
        const deleteIndex = state.allIds.indexOf(id)
        if (deleteIndex >= 0) {
          state.allIds.splice(deleteIndex, 1)
        }
        delete state.byIds[id]
      })

      state.pageIndex = Math.floor(state.allIds.length / state.pageSize) - 1
    },
    deleteError(state, action: PayloadAction<{assetIds: string[]; error: ClientError}>) {
      const {assetIds, error} = action.payload

      const itemErrors: ItemError[] = error?.response?.body?.error?.items?.map(
        (item: any) => item.error
      )

      assetIds?.forEach((id) => {
        state.byIds[id].updating = false
      })
      itemErrors?.forEach((item) => {
        state.byIds[item.id].error = item.description
      })
    },
    deleteRequest(state, action: PayloadAction<{assets: S3Asset[]; closeDialogId?: string}>) {
      const {assets} = action.payload
      assets.forEach((asset) => {
        state.byIds[asset?._id].updating = true
      })

      Object.keys(state.byIds).forEach((key) => {
        delete state.byIds[key].error
      })
    },
    deleteSkipped(state, action: PayloadAction<{assetIds: string[]; reason: string}>) {
      const {assetIds, reason} = action.payload
      assetIds.forEach((assetId) => {
        if (state.byIds[assetId]) {
          state.byIds[assetId].updating = false
          state.byIds[assetId].error = reason
        }
      })
    },
    fetchComplete(state, action: PayloadAction<{assets: S3Asset[]}>) {
      const assets = action.payload?.assets || []

      if (assets) {
        assets.forEach((asset) => {
          if (!state.allIds.includes(asset._id)) {
            state.allIds.push(asset._id)
          }
          state.byIds[asset._id] = {
            _type: 'asset',
            asset: asset,
            picked: false,
            updating: false,
          }
        })
      }

      state.fetching = false
      state.fetchCount = assets.length || 0
      delete state.fetchingError
    },
    fetchError(state, action: PayloadAction<HttpError>) {
      const error = action.payload
      state.fetching = false
      state.fetchingError = error
    },
    fetchRequest: {
      reducer: (state, _action: PayloadAction<{params: Record<string, any>; query: string}>) => {
        state.fetching = true
        delete state.fetchingError
      },
      prepare: ({
        params = {},
        queryFilter,
        selector = ``,
        sort = groq`order(_updatedAt desc)`,
      }: {
        params?: Record<string, any>
        queryFilter: string
        replace?: boolean
        selector?: string
        sort?: string
      }) => {
        const pipe = sort || selector ? '|' : ''

        // Construct query
        const query = groq`
          {
            "items": *[${queryFilter}] {
              _id,
              _type,
              _createdAt,
              _updatedAt,
              extension,
              metadata {
                dimensions
              },
              mimeType,
              opt {
                media
              },
              originalFilename,
              size,
              source {
                name,
                id,
                url,
              },
              title,
              url
            } ${pipe} ${sort} ${selector},
          }
        `

        return {payload: {params, query}}
      },
    },
    insertUploads(state, action: PayloadAction<{results: Record<string, string | null>}>) {
      const {results} = action.payload

      Object.entries(results).forEach(([hash, assetId]) => {
        if (assetId && !state.allIds.includes(hash)) {
          state.allIds.push(assetId)
        }
      })
    },
    listenerCreateQueue(_state, _action: PayloadAction<{asset: S3Asset}>) {
      //
    },
    listenerCreateQueueComplete(state, action: PayloadAction<{assets: S3Asset[]}>) {
      const {assets} = action.payload
      assets?.forEach((asset) => {
        if (state.byIds[asset?._id]?.asset) {
          state.byIds[asset._id].asset = asset
        }
      })
    },
    listenerDeleteQueue(_state, _action: PayloadAction<{assetId: string}>) {
      //
    },
    listenerDeleteQueueComplete(state, action: PayloadAction<{assetIds: string[]}>) {
      const {assetIds} = action.payload
      assetIds?.forEach((assetId) => {
        const deleteIndex = state.allIds.indexOf(assetId)
        if (deleteIndex >= 0) {
          state.allIds.splice(deleteIndex, 1)
        }
        delete state.byIds[assetId]
      })
    },
    listenerUpdateQueue(_state, _action: PayloadAction<{asset: S3Asset}>) {
      //
    },
    listenerUpdateQueueComplete(state, action: PayloadAction<{assets: S3Asset[]}>) {
      const {assets} = action.payload
      assets?.forEach((asset) => {
        if (state.byIds[asset?._id]?.asset) {
          state.byIds[asset._id].asset = asset
        }
      })
    },
    loadNextPage() {
      //
    },
    loadPageIndex(state, action: PayloadAction<{pageIndex: number}>) {
      //
      state.pageIndex = action.payload.pageIndex
    },
    orderSet(state, action: PayloadAction<{order: Order}>) {
      state.order = action.payload?.order
      state.pageIndex = 0
    },
    pick(state, action: PayloadAction<{assetId: string; picked: boolean}>) {
      const {assetId, picked} = action.payload

      state.byIds[assetId].picked = picked
      state.lastPicked = picked ? assetId : undefined
    },
    pickAll(state) {
      state.allIds.forEach((id) => {
        state.byIds[id].picked = true
      })
    },
    pickClear(state) {
      state.lastPicked = undefined
      Object.values(state.byIds).forEach((asset) => {
        state.byIds[asset.asset._id].picked = false
      })
    },
    pickRange(state, action: PayloadAction<{endId: string; startId: string}>) {
      const startIndex = state.allIds.findIndex((id) => id === action.payload.startId)
      const endIndex = state.allIds.findIndex((id) => id === action.payload.endId)

      // Sort numerically, ascending order
      const indices = [startIndex, endIndex].sort((a, b) => a - b)

      state.allIds.slice(indices[0], indices[1] + 1).forEach((key) => {
        state.byIds[key].picked = true
      })
      state.lastPicked = state.allIds[endIndex]
    },
    sort(state) {
      state.allIds.sort((a, b) => {
        const tagA = state.byIds[a].asset[state.order.field] as number
        const tagB = state.byIds[b].asset[state.order.field] as number

        if (tagA < tagB) {
          return state.order.direction === 'asc' ? -1 : 1
        } else if (tagA > tagB) {
          return state.order.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    },
    updateComplete(state, action: PayloadAction<{asset: S3Asset; closeDialogId?: string}>) {
      const {asset} = action.payload
      state.byIds[asset._id].updating = false
      state.byIds[asset._id].asset = asset
    },
    updateError(state, action: PayloadAction<{asset: S3Asset; error: HttpError}>) {
      const {asset, error} = action.payload

      const assetId = asset?._id
      state.byIds[assetId].error = error.message
      state.byIds[assetId].updating = false
    },
    updateRequest(
      state,
      action: PayloadAction<{
        asset: S3Asset
        closeDialogId?: string
        formData: Record<string, any>
      }>
    ) {
      const assetId = action.payload?.asset?._id
      state.byIds[assetId].updating = true
    },
    viewSet(state, action: PayloadAction<{view: BrowserView}>) {
      state.view = action.payload?.view
    },
  },
})

export const assetsActions = {...assetsSlice.actions}

// Epics

export const assetsDeleteEpic: Epic = (action$, _state$, {sanityClient, s3Client}) =>
  action$.pipe(
    filter(assetsActions.deleteRequest.match),
    mergeMap((action) => {
      const {assets} = action.payload
      const assetIds = assets.map((asset) => asset._id)

      return sanityClient.observable
        .fetch<{_id: string; referenceCount: number}[]>(
          groq`*[_id in $assetIds]{_id, "referenceCount": count(*[references(^._id)])}`,
          {assetIds}
        )
        .pipe(
          mergeMap((referenceResults) => {
            const referenceMap = new Map(
              referenceResults.map((item) => [item._id, item.referenceCount])
            )

            const blockedAssets = assets.filter((asset) => (referenceMap.get(asset._id) || 0) > 0)
            const deletableAssets = assets.filter(
              (asset) => (referenceMap.get(asset._id) || 0) === 0
            )

            const blockedIds = blockedAssets.map((asset) => asset._id)
            const deletableIds = deletableAssets.map((asset) => asset._id)

            const blockedActions$ = blockedIds.length
              ? of(
                  assetsActions.deleteSkipped({
                    assetIds: blockedIds,
                    reason: 'Asset has references and cannot be deleted.',
                  })
                )
              : EMPTY

            if (deletableAssets.length === 0) {
              return blockedActions$
            }

            const deleteRequests = deletableAssets.map((asset) =>
              s3Client.observable.assets.deleteAsset({fileName: buildFileName(asset)})
            )

            const deleteFlow$ = forkJoin(deleteRequests).pipe(
              mergeMap(() =>
                sanityClient.observable.delete({
                  query: groq`*[_id in ${JSON.stringify(deletableIds)}]`,
                })
              ),
              mergeMap(() => of(assetsActions.deleteComplete({assetIds: deletableIds}))),
              catchError((error: ClientError) => {
                return of(assetsActions.deleteError({assetIds: deletableIds, error}))
              })
            )

            return blockedIds.length ? concat(blockedActions$, deleteFlow$) : deleteFlow$
          }),
          catchError((error: ClientError) => of(assetsActions.deleteError({assetIds, error})))
        )
    })
  )

export const assetsFetchEpic: Epic = (action$, state$, {sanityClient}) =>
  action$.pipe(
    filter(assetsActions.fetchRequest.match),
    withLatestFrom(state$),
    switchMap(([action]) => {
      const params = action.payload?.params
      const query = action.payload?.query

      return of(action).pipe(
        mergeMap(() =>
          sanityClient.observable.fetch<{
            items: S3Asset[]
          }>(query, params)
        ),
        mergeMap((result) => {
          const {
            items,
            // totalCount
          } = result
          return of(assetsActions.fetchComplete({assets: items}))
        }),
        catchError((error: ClientError) =>
          of(
            assetsActions.fetchError({
              message: error?.message || 'Internal error',
              statusCode: error?.statusCode || 500,
            })
          )
        )
      )
    })
  )

export const assetsFetchPageIndexEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(assetsActions.loadPageIndex.match),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const pageSize = state.assets.pageSize
      const start = action.payload.pageIndex * pageSize
      const end = start + pageSize

      // Document ID can be null when operating on pristine / unsaved drafts
      const documentId = state?.selected.document?._id
      const documentAssetIds = state?.selected?.documentAssetIds

      const constructedFilter = constructFilter({
        assetTypes: state.assets.assetTypes,
        searchQuery: state.search.query,
      })

      const params = {
        ...(documentId ? {documentId} : {}),
        documentAssetIds,
      }

      return of(
        assetsActions.fetchRequest({
          params,
          queryFilter: constructedFilter,
          selector: groq`[${start}...${end}]`,
          sort: groq`order(${state.assets?.order?.field} ${state.assets?.order?.direction})`,
        })
      )
    })
  )

export const assetsFetchNextPageEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(assetsActions.loadNextPage.match),
    withLatestFrom(state$),
    switchMap(([_action, state]) =>
      of(assetsActions.loadPageIndex({pageIndex: state.assets.pageIndex + 1}))
    )
  )

export const assetsFetchAfterDeleteAllEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(assetsActions.deleteComplete.match),
    withLatestFrom(state$),
    switchMap(([_action, state]) => {
      if (state.assets.allIds.length === 0) {
        const nextPageIndex = Math.floor(state.assets.allIds.length / state.assets.pageSize)
        return of(assetsActions.loadPageIndex({pageIndex: nextPageIndex}))
      }

      return EMPTY
    })
  )

export const assetsOrderSetEpic: Epic = (action$) =>
  action$.pipe(
    filter(assetsActions.orderSet.match),
    mergeMap(() => {
      return of(
        assetsActions.clear(), //
        assetsActions.loadPageIndex({pageIndex: 0})
      )
    })
  )

export const assetsSearchEpic: Epic = (action$) =>
  action$.pipe(
    ofType(searchActions.querySet.type),
    debounceTime(400),
    mergeMap(() => {
      return of(
        assetsActions.clear(), //
        assetsActions.loadPageIndex({pageIndex: 0})
      )
    })
  )

export const assetsListenerCreateQueueEpic: Epic = (action$) =>
  action$.pipe(
    filter(assetsActions.listenerCreateQueue.match),
    bufferTime(2000),
    filter((actions) => actions.length > 0),
    mergeMap((actions) => {
      const assets = actions?.map((action) => action.payload.asset)
      return of(assetsActions.listenerCreateQueueComplete({assets}))
    })
  )

export const assetsListenerDeleteQueueEpic: Epic = (action$) =>
  action$.pipe(
    filter(assetsActions.listenerDeleteQueue.match),
    bufferTime(2000),
    filter((actions) => actions.length > 0),
    mergeMap((actions) => {
      const assetIds = actions?.map((action) => action.payload.assetId)
      return of(assetsActions.listenerDeleteQueueComplete({assetIds}))
    })
  )

export const assetsListenerUpdateQueueEpic: Epic = (action$) =>
  action$.pipe(
    filter(assetsActions.listenerUpdateQueue.match),
    bufferTime(2000),
    filter((actions) => actions.length > 0),
    mergeMap((actions) => {
      const assets = actions?.map((action) => action.payload.asset)
      return of(assetsActions.listenerUpdateQueueComplete({assets}))
    })
  )

// Re-sort on all updates (immediate and batched listener events)
export const assetsSortEpic: Epic = (action$) =>
  action$.pipe(
    ofType(
      assetsActions.insertUploads.type,
      assetsActions.listenerUpdateQueueComplete.type,
      assetsActions.updateComplete.type
    ),
    mergeMap(() => of(assetsActions.sort()))
  )

export const assetsUnpickEpic: Epic = (action$) =>
  action$.pipe(
    ofType(assetsActions.orderSet.type, assetsActions.viewSet.type, searchActions.querySet.type),
    mergeMap(() => {
      return of(assetsActions.pickClear())
    })
  )

export const assetsUpdateEpic: Epic = (action$, state$, {sanityClient}) =>
  action$.pipe(
    filter(assetsActions.updateRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {asset, closeDialogId, formData} = action.payload

      return of(action).pipe(
        mergeMap(() =>
          from(
            sanityClient
              .patch(asset._id)
              .setIfMissing({opt: {}})
              .setIfMissing({'opt.media': {}})
              .set(formData)
              .commit()
          )
        ),
        mergeMap((updatedAsset: any) =>
          of(
            assetsActions.updateComplete({
              asset: updatedAsset,
              closeDialogId,
            })
          )
        ),
        catchError((error: ClientError) =>
          of(
            assetsActions.updateError({
              asset,
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500,
              },
            })
          )
        )
      )
    })
  )

// Selectors

const selectAssetsByIds = (state: RootReducerState) => state.assets.byIds

const selectAssetsAllIds = (state: RootReducerState) => state.assets.allIds

export const selectAssetById = createSelector(
  [
    (state: RootReducerState) => state.assets.byIds,
    (_state: RootReducerState, assetId: string) => assetId,
  ],
  (byIds, assetId) => {
    const asset = byIds[assetId]
    return asset ? asset : undefined
  }
)

const selectAssets: Selector<RootReducerState, AssetItem[]> = createSelector(
  [selectAssetsByIds, selectAssetsAllIds],
  (byIds, allIds) => allIds.map((id) => byIds[id])
)

export const selectAssetsLength = createSelector([selectAssets], (assets) => assets.length)

export const selectAssetsPicked = createSelector([selectAssets], (assets) =>
  assets.filter((item) => item?.picked)
)

export const selectAssetsPickedLength = createSelector(
  [selectAssetsPicked],
  (assetsPicked) => assetsPicked.length
)

export const assetsReducer = assetsSlice.reducer
