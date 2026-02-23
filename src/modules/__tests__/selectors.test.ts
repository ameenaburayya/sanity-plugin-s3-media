import {selectCombinedItems} from '../selectors'

describe('selectCombinedItems', () => {
  it('returns uploads first and then assets', () => {
    const state = {
      assets: {allIds: ['asset-1', 'asset-2']},
      uploads: {allIds: ['upload-1']},
    } as any

    expect(selectCombinedItems(state)).toEqual([
      {id: 'upload-1', type: 'upload'},
      {id: 'asset-1', type: 'asset'},
      {id: 'asset-2', type: 'asset'},
    ])
  })

  it('returns an empty list when both ids are empty', () => {
    const state = {
      assets: {allIds: []},
      uploads: {allIds: []},
    } as any

    expect(selectCombinedItems(state)).toEqual([])
  })
})
