import {BehaviorSubject, lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {assetsActions} from '../assets'
import {rootEpic} from '../rootEpic'
import {rootReducer} from '../rootReducer'
import {uploadsActions} from '../uploads'
import {UPLOADS_ACTIONS} from '../uploads/actions'

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
  }) as any

describe('rootEpic', () => {
  it('includes assets order set and unpick flows', async () => {
    const state = rootReducer(undefined, {type: 'unknown'} as any)
    const action = assetsActions.orderSet({order: {direction: 'asc', field: 'size'} as any})

    const result = await lastValueFrom(
      rootEpic(of(action) as any, new BehaviorSubject(state) as any, makeDeps()).pipe(toArray()),
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
    const state = rootReducer(undefined, {type: 'unknown'} as any)
    const asset = {
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
      sha1hash: 'hash-1',
      size: 1024,
    } as any

    const result = await lastValueFrom(
      rootEpic(
        of(UPLOADS_ACTIONS.uploadComplete({asset})) as any,
        new BehaviorSubject(state) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([uploadsActions.checkRequest({assets: [asset]})])
  })

  it('can emit no actions for unrelated input', async () => {
    const state = rootReducer(undefined, {type: 'unknown'} as any)

    const result = await lastValueFrom(
      rootEpic(of({type: 'not/matched'}) as any, new BehaviorSubject(state) as any, makeDeps()).pipe(
        toArray(),
      ),
    )

    expect(result).toEqual([])
  })
})
