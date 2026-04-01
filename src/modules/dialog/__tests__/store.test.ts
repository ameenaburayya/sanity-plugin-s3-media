import type {StateObservable} from 'redux-observable'
import {EMPTY, lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {S3ImageAsset} from 'sanity-plugin-s3-media-types'
import type {AssetItem, RootReducerState} from 'src/types'

import {assetsActions} from '../../assets'
import {dialogActions, dialogClearOnAssetUpdateEpic, dialogReducer} from '../store'

const EMPTY_STATE$ = EMPTY as unknown as StateObservable<RootReducerState>

const makeImageAsset = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    _id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg',
    _type: 's3ImageAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'jpg',
    metadata: {
      _type: 's3ImageMetadata',
      dimensions: {
        _type: 's3ImageDimensions',
        aspectRatio: 1.5,
        height: 80,
        width: 120,
      },
    },
    mimeType: 'image/jpeg',
    sha1hash: 'hash-image',
    size: 1024,
    ...overrides,
  }) as unknown as S3ImageAsset

describe('dialogReducer', () => {
  it('shows an asset edit dialog', () => {
    const state = dialogReducer(undefined, dialogActions.showAssetEdit({assetId: 'asset-1'}))

    expect(state.items).toEqual([{assetId: 'asset-1', id: 'asset-1', type: 'assetEdit'}])
  })

  it('shows a delete confirmation dialog with pluralized labels', () => {
    const assets: AssetItem[] = [
      {_type: 'asset', asset: makeImageAsset({_id: 'asset-1'}), picked: false, updating: false},
      {_type: 'asset', asset: makeImageAsset({_id: 'asset-2'}), picked: false, updating: false},
    ]

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
      dialogClearOnAssetUpdateEpic(of(action), EMPTY_STATE$, {} as never).pipe(toArray()),
    )

    expect(result).toEqual([dialogActions.remove({id: 'dialog-1'})])
  })

  it('emits nothing when there is no closeDialogId', async () => {
    const result = await lastValueFrom(
      dialogClearOnAssetUpdateEpic(
        of(assetsActions.updateComplete({asset: makeImageAsset()})),
        EMPTY_STATE$,
        {} as never,
      ).pipe(toArray()),
    )

    expect(result).toEqual([])
  })
})
