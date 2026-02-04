import {createSelector, createSlice, type PayloadAction} from '@reduxjs/toolkit'
import type {ClientError} from '@sanity/client'
import groq from 'groq'
import {empty, merge, of, throwError} from 'rxjs'
import {catchError, delay, filter, mergeMap, takeUntil, withLatestFrom} from 'rxjs/operators'

import {uploadS3Asset} from '../../lib'
import type {RootReducerState, S3AssetDocument, UploadProgressEvent} from '../../types'
import {Epic, HttpError, S3AssetType, UploadItem} from '../../types'
import {constructFilter, generatePreviewBlobUrl$, hashFile} from '../../utils'
import {assetsActions} from '../assets'
import {UPLOADS_ACTIONS} from './actions'

type UploadsReducerState = {
  allIds: string[]
  byIds: Record<string, UploadItem>
}

const initialState = {
  allIds: [],
  byIds: {},
} as UploadsReducerState

const uploadsSlice = createSlice({
  name: 'uploads',
  initialState,
  extraReducers: (builder) => {
    builder //
      .addCase(UPLOADS_ACTIONS.uploadComplete, (state, action) => {
        const {asset} = action.payload
        if (state.byIds[asset.sha1hash]) {
          state.byIds[asset.sha1hash].status = 'complete'
        }
      })
  },
  reducers: {
    checkRequest(_state, _action: PayloadAction<{assets: S3AssetDocument[]}>) {
      //
    },
    checkComplete(state, action: PayloadAction<{results: Record<string, string | null>}>) {
      const {results} = action.payload

      const assetHashes = Object.keys(results)

      assetHashes.forEach((hash) => {
        const deleteIndex = state.allIds.indexOf(hash)
        if (deleteIndex >= 0) {
          state.allIds.splice(deleteIndex, 1)
        }

        if (state.byIds[hash]) {
          const blobUrl = state.byIds[hash].objectUrl
          if (blobUrl) {
            window.URL.revokeObjectURL(blobUrl)
          }

          delete state.byIds[hash]
        }
      })
    },
    previewReady(state, action: PayloadAction<{hash: string; blobUrl: string}>) {
      const {blobUrl, hash} = action.payload
      if (state.byIds[hash]) {
        state.byIds[hash].objectUrl = blobUrl
      }
    },
    uploadCancel(state, action: PayloadAction<{hash: string}>) {
      const {hash} = action.payload
      const deleteIndex = state.allIds.indexOf(hash)
      if (deleteIndex >= 0) {
        state.allIds.splice(deleteIndex, 1)
      }
      if (state.byIds[hash]) {
        delete state.byIds[hash]
      }
    },
    uploadError(state, action: PayloadAction<{error: HttpError; hash: string}>) {
      const {hash} = action.payload
      const deleteIndex = state.allIds.indexOf(hash)
      if (deleteIndex >= 0) {
        state.allIds.splice(deleteIndex, 1)
      }
      delete state.byIds[hash]
    },

    uploadRequest(_state, _action: PayloadAction<{file: File; forceAsAssetType?: S3AssetType}>) {
      //
    },
    uploadProgress(state, action: PayloadAction<{event: UploadProgressEvent; uploadHash: string}>) {
      const {event, uploadHash} = action.payload
      state.byIds[uploadHash].percent = event.percent
      state.byIds[uploadHash].status = 'uploading'
    },
    uploadStart(state, action: PayloadAction<{file: File; uploadItem: UploadItem}>) {
      const {uploadItem} = action.payload

      if (!state.allIds.includes(uploadItem.hash)) {
        state.allIds.push(uploadItem.hash)
      }
      state.byIds[uploadItem.hash] = uploadItem
    },
  },
})

export const uploadsActions = {...uploadsSlice.actions}

// Epics

export const uploadsAssetStartEpic: Epic = (action$, _state$, {sanityClient, s3Client}) =>
  action$.pipe(
    filter(uploadsActions.uploadStart.match),
    mergeMap((action) => {
      const {file, uploadItem} = action.payload

      return merge(
        // Generate low res preview
        of(null).pipe(
          mergeMap(() => generatePreviewBlobUrl$(file)),
          mergeMap((url) => {
            return of(
              uploadsActions.previewReady({
                blobUrl: url,
                hash: uploadItem.hash,
              }),
            )
          }),
        ),
        // Upload asset and receive progress / complete events
        of(null).pipe(
          // delay(500000), // debug uploads
          mergeMap(() =>
            uploadS3Asset({assetType: uploadItem.assetType, s3Client, sanityClient, file}),
          ),
          takeUntil(
            action$.pipe(
              filter(uploadsActions.uploadCancel.match),
              filter((v) => v.payload.hash === uploadItem.hash),
            ),
          ),
          mergeMap((event) => {
            if (event?.type === 'complete') {
              if (event.exists) {
                return throwError({
                  message: 'Asset already exists',
                  statusCode: 409,
                } as HttpError)
              }

              return of(
                UPLOADS_ACTIONS.uploadComplete({
                  asset: event.asset,
                }),
              )
            }
            if (event?.type === 'progress' && event?.stage === 'upload') {
              return of(
                uploadsActions.uploadProgress({
                  event,
                  uploadHash: uploadItem.hash,
                }),
              )
            }
            return empty()
          }),
          catchError((error: ClientError) =>
            of(
              uploadsActions.uploadError({
                error: {
                  message: error?.message || 'Internal error',
                  statusCode: error?.statusCode || 500,
                },
                hash: uploadItem.hash,
              }),
            ),
          ),
        ),
      )
    }),
  )

export const uploadsAssetUploadEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(uploadsActions.uploadRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {file, forceAsAssetType} = action.payload

      return of(action).pipe(
        // Generate SHA1 hash from local file
        // This will throw in insecure contexts (non-localhost / https)
        mergeMap(() => hashFile(file)),
        // Ignore if the file exists and is currently being uploaded
        filter((hash) => {
          const exists = !!state.uploads.byIds[hash]
          return !exists
        }),
        // Dispatch start action and begin upload process
        mergeMap((hash) => {
          const assetType =
            forceAsAssetType ||
            (file.type.indexOf('image') >= 0 ? S3AssetType.IMAGE : S3AssetType.FILE)

          const uploadItem = {
            hash,
            _type: 'upload',
            assetType,
            name: file.name,
            size: file.size,
            status: 'queued',
          } as UploadItem

          return of(uploadsActions.uploadStart({file, uploadItem}))
        }),
      )
    }),
  )

export const uploadsCompleteQueueEpic: Epic = (action$) =>
  action$.pipe(
    filter(UPLOADS_ACTIONS.uploadComplete.match),
    mergeMap((action) => {
      return of(
        uploadsActions.checkRequest({
          assets: [action.payload.asset],
        }),
      )
    }),
  )

export const uploadsCheckRequestEpic: Epic = (action$, state$, {sanityClient}) =>
  action$.pipe(
    filter(uploadsActions.checkRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {assets} = action.payload

      const documentIds = assets.map((asset) => asset._id)

      const constructedFilter = constructFilter({
        assetTypes: state.assets.assetTypes,
        searchQuery: state.search.query,
      })

      const query = groq`
        *[${constructedFilter} && _id in $documentIds].sha1hash
      `

      return of(action).pipe(
        delay(1000), // give Sanity some time to register the recently uploaded asset
        mergeMap(() => sanityClient.observable.fetch<string[]>(query, {documentIds})),
        mergeMap((resultHashes) => {
          const checkedResults = assets.reduce((acc: Record<string, string | null>, asset) => {
            acc[asset.sha1hash] = resultHashes.includes(asset.sha1hash) ? asset._id : null
            return acc
          }, {})

          return of(
            uploadsActions.checkComplete({results: checkedResults}), //
            assetsActions.insertUploads({results: checkedResults}),
          )
        }),
      )
    }),
  )

export const selectUploadById = createSelector(
  [
    (state: RootReducerState) => state.uploads.byIds,
    (_state: RootReducerState, uploadId: string) => uploadId,
  ],
  (byIds, uploadId) => byIds[uploadId],
)

export const uploadsReducer = uploadsSlice.reducer
