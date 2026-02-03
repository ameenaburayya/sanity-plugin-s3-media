import {createSlice, type PayloadAction} from '@reduxjs/toolkit'
import pluralize from 'pluralize'
import {ofType} from 'redux-observable'
import {of} from 'rxjs'
import {filter, mergeMap} from 'rxjs/operators'

import type {S3ImageAsset} from '../../types'
import type {MyEpic} from '../../types'
import {assetsActions} from '../assets'
import {uploadsActions} from '../uploads'

type Notification = {
  asset?: S3ImageAsset
  status?: 'error' | 'warning' | 'success' | 'info'
  title?: string
}

type NotificationsReducerState = {
  items: Notification[]
}

const initialState = {
  items: [],
} as NotificationsReducerState

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    add(state, action: PayloadAction<Notification>) {
      const {asset, status, title} = action.payload
      state.items.push({
        asset,
        status,
        title,
      })
    },
  },
})

// Epics

export const notificationsAssetsDeleteCompleteEpic: MyEpic = (action$) =>
  action$.pipe(
    filter(assetsActions.deleteComplete.match),
    mergeMap((action) => {
      const {assetIds} = action.payload
      const deletedCount = assetIds.length
      return of(
        notificationsSlice.actions.add({
          status: 'info',
          title: `${deletedCount} ${pluralize('asset', deletedCount)} deleted`,
        })
      )
    })
  )

export const notificationsAssetsDeleteErrorEpic: MyEpic = (action$) =>
  action$.pipe(
    filter(assetsActions.deleteError.match),
    mergeMap((action) => {
      const {assetIds} = action.payload
      const count = assetIds.length
      return of(
        notificationsSlice.actions.add({
          status: 'error',
          title: `Unable to delete ${count} ${pluralize(
            'asset',
            count
          )}. Please review any asset errors and try again.`,
        })
      )
    })
  )

export const notificationsAssetsDeleteSkippedEpic: MyEpic = (action$) =>
  action$.pipe(
    filter(assetsActions.deleteSkipped.match),
    mergeMap((action) => {
      const {assetIds, reason} = action.payload
      const count = assetIds.length
      return of(
        notificationsSlice.actions.add({
          status: 'warning',
          title: `Skipped ${count} ${pluralize('asset', count)}. ${reason}`,
        })
      )
    })
  )

export const notificationsAssetsUploadCompleteEpic: MyEpic = (action$) =>
  action$.pipe(
    filter(uploadsActions.checkComplete.match),
    mergeMap((action) => {
      const {results} = action.payload

      const count = Object.keys(results).length
      return of(
        notificationsSlice.actions.add({
          status: 'info',
          title: `Uploaded ${count} ${pluralize('asset', count)}`,
        })
      )
    })
  )

export const notificationsGenericErrorEpic: MyEpic = (action$) =>
  action$.pipe(
    ofType(
      assetsActions.fetchError.type,
      assetsActions.updateError.type,
      uploadsActions.uploadError.type
    ),
    mergeMap((action: {payload: {error: {message: string}}}) => {
      const error = action.payload?.error

      return of(
        notificationsSlice.actions.add({
          status: 'error',
          title: `An error occured: ${error?.message}`,
        })
      )
    })
  )

export const notificationsActions = {...notificationsSlice.actions}

export const notificationsReducer = notificationsSlice.reducer
