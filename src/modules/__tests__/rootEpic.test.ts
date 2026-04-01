import type {Action} from '@reduxjs/toolkit'
import type {StateObservable} from 'redux-observable'
import {BehaviorSubject, lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import type {S3ImageAsset} from 'sanity-plugin-s3-media-types'

import type {S3Client} from '../../lib/S3Client'
import {assetsActions} from '../assets'
import {rootEpic} from '../rootEpic'
import {rootReducer} from '../rootReducer'
import {uploadsActions} from '../uploads'
import {UPLOADS_ACTIONS} from '../uploads/actions'

type MockSanityClient = Pick<SanityClient, 'observable'>
type MockS3Client = Pick<S3Client, 'observable'>
type RootEpicDeps = {
  sanityClient: MockSanityClient
  s3Client: MockS3Client
}

const makeDeps = () =>
  ({
    sanityClient: {
      observable: {
        delete: vi.fn(),
        fetch: vi.fn(),
      },
      patch: vi.fn(),
    },
    s3Client: {
      observable: {
        assets: {
          deleteAsset: vi.fn(),
        },
      },
    },
  }) as unknown as RootEpicDeps as unknown as {s3Client: S3Client; sanityClient: SanityClient}

describe('rootEpic', () => {
  it('includes assets order set and unpick flows', async () => {
    const state = rootReducer(undefined, assetsActions.orderSet({order: {direction: 'asc', field: 'size'}}))
    const action = assetsActions.orderSet({order: {direction: 'asc', field: 'size'}})

    const result = await lastValueFrom(
      rootEpic(of(action), new BehaviorSubject(state) as unknown as StateObservable<typeof state>, makeDeps()).pipe(toArray()),
    )

    expect(result).toEqual(
      expect.arrayContaining([
        assetsActions.clear(),
        assetsActions.loadPageIndex({pageIndex: 0}),
        assetsActions.pickClear(),
      ]),
    )
    expect(result).toHaveLength(3)
  })

  it('includes uploads complete queue flow', async () => {
    const state = rootReducer(undefined, assetsActions.orderSet({order: {direction: 'asc', field: 'size'}}))
    const asset = {
      _id: 's3Image-abcdefghijklmnopqrstuvwx-120x80-jpg',
      _type: 's3ImageAsset',
      assetId: 'abcdefghijklmnopqrstuvwx',
      extension: 'jpg',
      metadata: {
        _type: 's3ImageMetadata' as const,
        dimensions: {
          _type: 's3ImageDimensions' as const,
          aspectRatio: 1.5,
          height: 80,
          width: 120,
        },
      },
      mimeType: 'image/jpeg',
      sha1hash: 'hash-1',
      size: 1024,
    } as unknown as S3ImageAsset

    const result = await lastValueFrom(
      rootEpic(
        of(UPLOADS_ACTIONS.uploadComplete({asset})),
        new BehaviorSubject(state) as unknown as StateObservable<typeof state>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([uploadsActions.checkRequest({assets: [asset]})])
  })

  it('can emit no actions for unrelated input', async () => {
    const state = rootReducer(undefined, assetsActions.orderSet({order: {direction: 'asc', field: 'size'}}))
    const action: Action = {type: 'not/matched'}

    const result = await lastValueFrom(
      rootEpic(
        of(action),
        new BehaviorSubject(state) as unknown as StateObservable<typeof state>,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([])
  })
})
