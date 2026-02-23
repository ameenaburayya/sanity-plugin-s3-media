import {EMPTY, lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {assetsActions} from '../../assets'
import {uploadsActions} from '../../uploads'
import {
  notificationsActions,
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteSkippedEpic,
  notificationsAssetsUploadCompleteEpic,
  notificationsGenericErrorEpic,
  notificationsReducer,
} from '../store'

describe('notificationsReducer', () => {
  it('adds notifications', () => {
    const state = notificationsReducer(
      undefined,
      notificationsActions.add({status: 'info', title: 'Hello'}),
    )

    expect(state.items).toEqual([{status: 'info', title: 'Hello'}])
  })
})

describe('notification epics', () => {
  it('emits delete complete message', async () => {
    const result = await lastValueFrom(
      notificationsAssetsDeleteCompleteEpic(
        of(assetsActions.deleteComplete({assetIds: ['a', 'b']})) as any,
        EMPTY as any,
        {} as any,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      notificationsActions.add({status: 'info', title: '2 assets deleted'}),
    ])
  })

  it('emits delete error message', async () => {
    const result = await lastValueFrom(
      notificationsAssetsDeleteErrorEpic(
        of(assetsActions.deleteError({assetIds: ['a'], error: {message: 'boom'} as any})) as any,
        EMPTY as any,
        {} as any,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      notificationsActions.add({
        status: 'error',
        title: 'Unable to delete 1 asset. Please review any asset errors and try again.',
      }),
    ])
  })

  it('emits delete skipped warning message', async () => {
    const result = await lastValueFrom(
      notificationsAssetsDeleteSkippedEpic(
        of(assetsActions.deleteSkipped({assetIds: ['a', 'b'], reason: 'Referenced'})) as any,
        EMPTY as any,
        {} as any,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      notificationsActions.add({
        status: 'warning',
        title: 'Skipped 2 assets. Referenced',
      }),
    ])
  })

  it('emits upload complete count message', async () => {
    const result = await lastValueFrom(
      notificationsAssetsUploadCompleteEpic(
        of(uploadsActions.checkComplete({results: {h1: 'asset-1', h2: null}})) as any,
        EMPTY as any,
        {} as any,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      notificationsActions.add({status: 'info', title: 'Uploaded 2 assets'}),
    ])
  })

  it('maps generic error actions to notifications', async () => {
    const actions = [
      assetsActions.fetchError({message: 'Fetch failed', statusCode: 500}),
      assetsActions.updateError({
        asset: {_id: 'a1', _type: 's3FileAsset'} as any,
        error: {message: 'Update failed', statusCode: 400},
      }),
      uploadsActions.uploadError({
        error: {message: 'Upload failed', statusCode: 500},
        hash: 'hash-1',
      }),
    ]

    const result = await lastValueFrom(
      notificationsGenericErrorEpic(of(...actions) as any, EMPTY as any, {} as any).pipe(toArray()),
    )

    expect(result).toEqual([
      notificationsActions.add({status: 'error', title: 'An error occured: undefined'}),
      notificationsActions.add({status: 'error', title: 'An error occured: Update failed'}),
      notificationsActions.add({status: 'error', title: 'An error occured: Upload failed'}),
    ])
  })
})
