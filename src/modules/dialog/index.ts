import {createSlice, type PayloadAction} from '@reduxjs/toolkit'
import pluralize from 'pluralize'
import {ofType} from 'redux-observable'
import {EMPTY, of} from 'rxjs'
import {filter, mergeMap} from 'rxjs/operators'

import type {AssetItem, Dialog, Epic} from '../../types'
import {assetsActions} from '../assets'

type DialogReducerState = {
  items: Dialog[]
}

const initialState = {
  items: [],
} as DialogReducerState

const dialogSlice = createSlice({
  name: 'dialog',
  initialState,
  reducers: {
    // Clear all dialogs
    clear(state) {
      state.items = []
    },
    // Remove dialog by id
    remove(state, action: PayloadAction<{id: string}>) {
      const id = action.payload?.id
      state.items = state.items.filter((item) => item.id !== id)
    },
    showConfirmDeleteAssets(
      state,
      action: PayloadAction<{assets: AssetItem[]; closeDialogId?: string}>,
    ) {
      const {assets, closeDialogId} = action.payload

      const suffix = `${assets.length} ${pluralize('asset', assets.length)}`

      state.items.push({
        closeDialogId,
        confirmCallbackAction: assetsActions.deleteRequest({
          assets: assets.map((assetItem) => assetItem.asset),
        }),
        confirmText: `Yes, delete ${suffix}`,
        description: 'This operation cannot be reversed. Are you sure you want to continue?',
        title: `Permanently delete ${suffix}?`,
        id: 'confirm',
        headerTitle: 'Confirm deletion',
        tone: 'critical',
        type: 'confirm',
      })
    },
    showAssetEdit(state, action: PayloadAction<{assetId: string}>) {
      const {assetId} = action.payload
      state.items.push({
        assetId,
        id: assetId,
        type: 'assetEdit',
      })
    },
  },
})

// Epics

export const dialogClearOnAssetUpdateEpic: Epic = (action$) =>
  action$.pipe(
    ofType(assetsActions.deleteComplete.type, assetsActions.updateComplete.type),
    filter(
      (action: {
        payload: {closeDialogId?: string}
      }): action is PayloadAction<{closeDialogId?: string}> => !!action?.payload?.closeDialogId,
    ),
    mergeMap((action) => {
      const dialogId = action?.payload?.closeDialogId
      if (dialogId) {
        return of(dialogSlice.actions.remove({id: dialogId}))
      }
      return EMPTY
    }),
  )

export const dialogActions = {...dialogSlice.actions}

export const dialogReducer = dialogSlice.reducer
