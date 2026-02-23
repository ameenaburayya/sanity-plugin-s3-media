import {createSlice, type PayloadAction} from '@reduxjs/toolkit'

type SearchState = {
  query: string
}

const initialState = {
  query: '',
} as SearchState

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    querySet(state, action: PayloadAction<{searchQuery: string}>) {
      state.query = action.payload?.searchQuery
    },
  },
})

export const searchActions = {...searchSlice.actions}

export const searchReducer = searchSlice.reducer
