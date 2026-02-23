import {selectedReducer} from '../store'

describe('selectedReducer', () => {
  it('returns initial state for unknown actions', () => {
    expect(selectedReducer(undefined, {type: 'unknown'})).toEqual({
      assets: [],
      document: undefined,
      documentAssetIds: [],
    })
  })
})
