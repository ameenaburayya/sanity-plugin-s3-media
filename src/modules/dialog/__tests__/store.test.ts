import {EMPTY, lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {assetsActions} from '../../assets'
import {dialogActions, dialogClearOnAssetUpdateEpic, dialogReducer} from '../store'

const makeImageAsset = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg',
    _type: 's3ImageAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'jpg',
    metadata: {
      dimensions: {
        aspectRatio: 1.5,
        height: 80,
        width: 120,
      },
    },
    mimeType: 'image/jpeg',
    sha1hash: 'hash-image',
    size: 1024,
    ...overrides,
  }) as any

describe('dialogReducer', () => {
  it('shows an asset edit dialog', () => {
    const state = dialogReducer(undefined, dialogActions.showAssetEdit({assetId: 'asset-1'}))

    expect(state.items).toEqual([{assetId: 'asset-1', id: 'asset-1', type: 'assetEdit'}])
  })

  it('shows a delete confirmation dialog with pluralized labels', () => {
    const assets = [
      {_type: 'asset', asset: makeImageAsset({_id: 'asset-1'}), picked: false, updating: false},
      {_type: 'asset', asset: makeImageAsset({_id: 'asset-2'}), picked: false, updating: false},
    ] as any

    const state = dialogReducer(
      undefined,
      dialogActions.showConfirmDeleteAssets({assets, closeDialogId: 'dialog-1'}),
    )

    expect(state.items[0]).toEqual({
      closeDialogId: 'dialog-1',
      confirmCallbackAction: assetsActions.deleteRequest({
        assets: [assets[0].asset, assets[1].asset],
      }),
      confirmText: 'Yes, delete 2 assets',
      description: 'This operation cannot be reversed. Are you sure you want to continue?',
      headerTitle: 'Confirm deletion',
      id: 'confirm',
      title: 'Permanently delete 2 assets?',
      tone: 'critical',
      type: 'confirm',
    })
  })

  it('removes and clears dialogs', () => {
    let state = dialogReducer(undefined, dialogActions.showAssetEdit({assetId: 'asset-1'}))
    state = dialogReducer(state, dialogActions.remove({id: 'asset-1'}))

    expect(state.items).toEqual([])

    state = dialogReducer(state, dialogActions.showAssetEdit({assetId: 'asset-2'}))
    state = dialogReducer(state, dialogActions.clear())

    expect(state.items).toEqual([])
  })
})

describe('dialogClearOnAssetUpdateEpic', () => {
  it('emits remove when deleteComplete carries closeDialogId', async () => {
    const action = {
      payload: {assetIds: ['asset-1'], closeDialogId: 'dialog-1'},
      type: assetsActions.deleteComplete.type,
    }

    const result = await lastValueFrom(
      dialogClearOnAssetUpdateEpic(of(action) as any, EMPTY as any, {} as any).pipe(toArray()),
    )

    expect(result).toEqual([dialogActions.remove({id: 'dialog-1'})])
  })

  it('emits nothing when there is no closeDialogId', async () => {
    const result = await lastValueFrom(
      dialogClearOnAssetUpdateEpic(
        of(assetsActions.updateComplete({asset: makeImageAsset()})) as any,
        EMPTY as any,
        {} as any,
      ).pipe(toArray()),
    )

    expect(result).toEqual([])
  })
})
