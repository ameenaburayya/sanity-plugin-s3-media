import {searchActions, searchReducer} from '../index'

describe('searchReducer', () => {
  it('returns the initial state', () => {
    expect(searchReducer(undefined, {type: 'unknown'})).toEqual({query: ''})
  })

  it('sets query with querySet', () => {
    const state = searchReducer(undefined, searchActions.querySet({searchQuery: 'cats'}))

    expect(state.query).toBe('cats')
  })
})
