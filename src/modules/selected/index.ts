import {createSlice} from '@reduxjs/toolkit'
import type {SanityDocument} from '@sanity/client'
import type {S3AssetDocument} from '../../types'

type SelectedReducerState = {
  assets: S3AssetDocument[]
  document?: SanityDocument
  documentAssetIds?: string[]
}

const initialState = {
  assets: [],
  document: undefined,
  documentAssetIds: [],
} as SelectedReducerState

const selectedSlice = createSlice({
  name: 'selected',
  initialState,
  reducers: {},
})

export const selectedReducer = selectedSlice.reducer
