import * as modules from '../index'

describe('modules index exports', () => {
  it('re-exports expected module APIs', () => {
    expect(modules.assetsActions).toBeDefined()
    expect(modules.assetsReducer).toBeDefined()
    expect(modules.dialogActions).toBeDefined()
    expect(modules.notificationsActions).toBeDefined()
    expect(modules.searchActions).toBeDefined()
    expect(modules.selectCombinedItems).toBeDefined()
    expect(modules.uploadsActions).toBeDefined()
    expect(modules.rootReducer).toBeDefined()
    expect(modules.rootEpic).toBeDefined()
  })
})
