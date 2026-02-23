import {BehaviorSubject, EMPTY, lastValueFrom, of, Subject, throwError} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {S3AssetType} from '../../../types'
import {assetsActions} from '../../assets'
import {UPLOADS_ACTIONS} from '../actions'
import {
  selectUploadById,
  uploadsActions,
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic,
  uploadsReducer,
} from '../store'

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

const makeUploadItem = (overrides: Record<string, unknown> = {}) =>
  ({
    _type: 'upload',
    assetType: S3AssetType.IMAGE,
    hash: 'hash-image',
    name: 'photo.jpg',
    size: 1024,
    status: 'queued',
    ...overrides,
  }) as any

const makeRootState = (overrides: Record<string, unknown> = {}) =>
  ({
    assets: {
      assetTypes: [],
    },
    search: {
      query: '',
    },
    uploads: {
      allIds: [],
      byIds: {},
    },
    ...overrides,
  }) as any

const makeDeps = () =>
  ({
    sanityClient: {
      observable: {
        fetch: vi.fn(),
        create: vi.fn(),
      },
    },
    s3Client: {
      observable: {
        assets: {
          uploadAsset: vi.fn(),
        },
      },
    },
  }) as any

const getSha1Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hash))

  return hashArray.map((value) => value.toString(16).padStart(2, '0')).join('')
}

const createPreviewEnvironment = () => {
  const revokeObjectURL = vi.fn()
  const createObjectURL = vi
    .fn()
    .mockReturnValueOnce('blob://large')
    .mockReturnValue('blob://preview')

  ;(globalThis as any).window = {
    URL: {
      createObjectURL,
      revokeObjectURL,
    },
  }

  class ImageMock {
    width = 120
    height = 80
    onload: null | (() => void) = null

    set src(_value: string) {
      this.onload?.()
    }
  }

  ;(globalThis as any).Image = ImageMock
  ;(globalThis as any).document = {
    createElement: vi.fn(() => ({
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({drawImage: vi.fn()})),
      toBlob: (callback: (blob: Blob | null) => void) =>
        callback(new Blob(['preview'], {type: 'image/jpeg'})),
    })),
  }

  return {createObjectURL, revokeObjectURL}
}

describe('uploadsReducer', () => {
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    ;(globalThis as any).window = {
      URL: {
        revokeObjectURL,
      },
    }

    revokeObjectURL.mockReset()
  })

  afterEach(() => {
    delete (globalThis as any).window
  })

  it('starts uploads and avoids duplicate ids', () => {
    const uploadItem = makeUploadItem()
    const file = {name: 'photo.jpg', size: 1024} as any

    let state = uploadsReducer(undefined, uploadsActions.uploadStart({file, uploadItem}))
    state = uploadsReducer(state, uploadsActions.uploadStart({file, uploadItem}))

    expect(state.allIds).toEqual(['hash-image'])
    expect(state.byIds['hash-image']).toEqual(uploadItem)
  })

  it('updates preview and progress', () => {
    const uploadItem = makeUploadItem()
    const file = {name: 'photo.jpg', size: 1024} as any

    let state = uploadsReducer(undefined, uploadsActions.uploadStart({file, uploadItem}))

    state = uploadsReducer(
      state,
      uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
    )

    state = uploadsReducer(
      state,
      uploadsActions.uploadProgress({
        event: {
          lengthComputable: true,
          percent: 55,
          stage: 'upload',
          type: 'progress',
        },
        uploadHash: 'hash-image',
      }),
    )

    expect(state.byIds['hash-image'].objectUrl).toBe('blob://preview')
    expect(state.byIds['hash-image'].percent).toBe(55)
    expect(state.byIds['hash-image'].status).toBe('uploading')
  })

  it('removes entries for cancel and error', () => {
    const uploadItem = makeUploadItem()
    const file = {name: 'photo.jpg', size: 1024} as any

    let state = uploadsReducer(undefined, uploadsActions.uploadStart({file, uploadItem}))
    state = uploadsReducer(state, uploadsActions.uploadCancel({hash: 'hash-image'}))

    expect(state.allIds).toEqual([])
    expect(state.byIds['hash-image']).toBeUndefined()

    state = uploadsReducer(undefined, uploadsActions.uploadStart({file, uploadItem}))
    state = uploadsReducer(
      state,
      uploadsActions.uploadError({
        error: {message: 'Upload failed', statusCode: 500},
        hash: 'hash-image',
      }),
    )

    expect(state.allIds).toEqual([])
    expect(state.byIds['hash-image']).toBeUndefined()
  })

  it('completes checks, revokes previews, and removes checked entries', () => {
    const file = {name: 'photo.jpg', size: 1024} as any

    const stateWithUpload = uploadsReducer(
      undefined,
      uploadsActions.uploadStart({
        file,
        uploadItem: makeUploadItem({objectUrl: 'blob://preview'}),
      }),
    )

    const state = uploadsReducer(
      stateWithUpload,
      uploadsActions.checkComplete({results: {'hash-image': 'asset-1', 'hash-other': null}}),
    )

    expect(revokeObjectURL).toHaveBeenCalledWith('blob://preview')
    expect(state.allIds).toEqual([])
    expect(state.byIds).toEqual({})
  })

  it('marks existing queued item as complete on uploadComplete', () => {
    const file = {name: 'photo.jpg', size: 1024} as any
    const stateWithUpload = uploadsReducer(
      undefined,
      uploadsActions.uploadStart({
        file,
        uploadItem: makeUploadItem({hash: 'hash-asset'}),
      }),
    )

    const state = uploadsReducer(
      stateWithUpload,
      UPLOADS_ACTIONS.uploadComplete({asset: makeImageAsset({sha1hash: 'hash-asset'})}),
    )

    expect(state.byIds['hash-asset'].status).toBe('complete')
  })

  it('executes no-op reducers for checkRequest and uploadRequest', () => {
    const state = uploadsReducer(undefined, {type: 'unknown'} as any)
    const asset = makeImageAsset()
    const file = {name: 'photo.jpg', size: 1024, type: 'image/jpeg'} as any

    const nextState = uploadsReducer(
      uploadsReducer(state, uploadsActions.checkRequest({assets: [asset]})),
      uploadsActions.uploadRequest({file}),
    )

    expect(nextState).toEqual(state)
  })
})

describe('uploads selectors', () => {
  it('selectUploadById returns upload item by hash', () => {
    const upload = makeUploadItem({hash: 'hash-1'})
    const state = makeRootState({
      uploads: {
        allIds: ['hash-1'],
        byIds: {'hash-1': upload},
      },
    })

    expect(selectUploadById(state, 'hash-1')).toEqual(upload)
    expect(selectUploadById(state, 'missing')).toBeUndefined()
  })
})

describe('uploads epics', () => {
  beforeEach(() => {
    createPreviewEnvironment()
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).Image
    delete (globalThis as any).document
    vi.useRealTimers()
  })

  it('uploadsAssetStartEpic emits preview, upload progress, and upload complete', async () => {
    const asset = {
      _id: 's3File-uploadedasset-jpg',
      _type: 's3FileAsset',
      assetId: 'uploadedasset',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      sha1hash: 'hash-image',
      size: 1024,
    } as any

    const uploadItem = makeUploadItem({assetType: S3AssetType.FILE, hash: 'hash-image'})

    const progressEvent = {
      lengthComputable: true,
      percent: 45,
      stage: 'upload',
      type: 'progress',
    }

    const downloadEvent = {
      lengthComputable: true,
      percent: 80,
      stage: 'download',
      type: 'progress',
    }

    const deps = makeDeps()
    deps.sanityClient.observable.fetch.mockReturnValue(of(null))
    deps.sanityClient.observable.create.mockReturnValue(of(asset))
    deps.s3Client.observable.assets.uploadAsset.mockReturnValue(
      of(progressEvent, downloadEvent, {type: 'response'}),
    )

    const result = await lastValueFrom(
      uploadsAssetStartEpic(
        of(
          uploadsActions.uploadStart({
            file: new File(['img'], 'photo.jpg', {type: 'image/jpeg'}) as any,
            uploadItem,
          }),
        ) as any,
        EMPTY as any,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toHaveLength(3)
    expect(result).toEqual(
      expect.arrayContaining([
        uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
        uploadsActions.uploadProgress({event: progressEvent as any, uploadHash: 'hash-image'}),
        UPLOADS_ACTIONS.uploadComplete({asset}),
      ]),
    )
  })

  it('uploadsAssetStartEpic maps already-existing asset completion to uploadError', async () => {
    const existingAsset = {
      _id: 's3File-existing-jpg',
      _type: 's3FileAsset',
      assetId: 'existing',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      sha1hash: 'hash-image',
      size: 1024,
    }

    const deps = makeDeps()
    deps.sanityClient.observable.fetch.mockReturnValue(of(existingAsset))

    const result = await lastValueFrom(
      uploadsAssetStartEpic(
        of(
          uploadsActions.uploadStart({
            file: new File(['img'], 'photo.jpg', {type: 'image/jpeg'}) as any,
            uploadItem: makeUploadItem({assetType: S3AssetType.FILE, hash: 'hash-image'}),
          }),
        ) as any,
        EMPTY as any,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
      uploadsActions.uploadError({
        error: {message: 'Asset already exists', statusCode: 409},
        hash: 'hash-image',
      }),
    ])
  })

  it('uploadsAssetStartEpic maps upload failures to uploadError', async () => {
    const deps = makeDeps()
    deps.sanityClient.observable.fetch.mockReturnValue(of(null))
    deps.s3Client.observable.assets.uploadAsset.mockReturnValue(
      throwError(() => ({
        message: 'S3 failed',
        statusCode: 503,
      })),
    )

    const result = await lastValueFrom(
      uploadsAssetStartEpic(
        of(
          uploadsActions.uploadStart({
            file: new File(['img'], 'photo.jpg', {type: 'image/jpeg'}) as any,
            uploadItem: makeUploadItem({assetType: S3AssetType.FILE, hash: 'hash-image'}),
          }),
        ) as any,
        EMPTY as any,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
      uploadsActions.uploadError({
        error: {message: 'S3 failed', statusCode: 503},
        hash: 'hash-image',
      }),
    ])
  })

  it('uploadsAssetStartEpic applies default error fallback values', async () => {
    const deps = makeDeps()
    deps.sanityClient.observable.fetch.mockReturnValue(of(null))
    deps.s3Client.observable.assets.uploadAsset.mockReturnValue(throwError(() => ({})))

    const result = await lastValueFrom(
      uploadsAssetStartEpic(
        of(
          uploadsActions.uploadStart({
            file: new File(['img'], 'photo.jpg', {type: 'image/jpeg'}) as any,
            uploadItem: makeUploadItem({assetType: S3AssetType.FILE, hash: 'hash-image'}),
          }),
        ) as any,
        EMPTY as any,
        deps,
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
      uploadsActions.uploadError({
        error: {message: 'Internal error', statusCode: 500},
        hash: 'hash-image',
      }),
    ])
  })

  it('uploadsAssetStartEpic stops stream on uploadCancel', async () => {
    const uploadEvents$ = new Subject<any>()

    const deps = makeDeps()
    deps.sanityClient.observable.fetch.mockReturnValue(of(null))
    deps.s3Client.observable.assets.uploadAsset.mockReturnValue(uploadEvents$)

    const action$ = new Subject<any>()
    const output$ = uploadsAssetStartEpic(action$ as any, EMPTY as any, deps)
    const resultPromise = lastValueFrom(output$.pipe(toArray()))

    action$.next(
      uploadsActions.uploadStart({
        file: new File(['img'], 'photo.jpg', {type: 'image/jpeg'}) as any,
        uploadItem: makeUploadItem({assetType: S3AssetType.FILE, hash: 'hash-image'}),
      }),
    )

    await Promise.resolve()
    await Promise.resolve()

    action$.next(uploadsActions.uploadCancel({hash: 'hash-image'}))

    uploadEvents$.next({
      lengthComputable: true,
      percent: 99,
      stage: 'upload',
      type: 'progress',
    })
    uploadEvents$.next({
      asset: makeImageAsset({sha1hash: 'hash-image'}),
      exists: false,
      type: 'complete',
    })

    uploadEvents$.complete()
    action$.complete()

    const result = await resultPromise

    expect(result).toEqual([
      uploadsActions.previewReady({blobUrl: 'blob://preview', hash: 'hash-image'}),
    ])
  })

  it('uploadsAssetUploadEpic starts queued upload for new hash', async () => {
    const file = new File(['img'], 'photo.jpg', {
      type: 'image/jpeg',
    }) as any

    const expectedHash = await getSha1Hash(file)

    const result = await lastValueFrom(
      uploadsAssetUploadEpic(
        of(uploadsActions.uploadRequest({file})) as any,
        new BehaviorSubject(makeRootState()) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.uploadStart({
        file,
        uploadItem: {
          _type: 'upload',
          assetType: S3AssetType.IMAGE,
          hash: expectedHash,
          name: 'photo.jpg',
          size: 3,
          status: 'queued',
        },
      }),
    ])
  })

  it('uploadsAssetUploadEpic respects forceAsAssetType and skips existing hashes', async () => {
    const file = new File(['img'], 'photo.jpg', {
      type: 'image/jpeg',
    }) as any

    const expectedHash = await getSha1Hash(file)

    let result = await lastValueFrom(
      uploadsAssetUploadEpic(
        of(uploadsActions.uploadRequest({file, forceAsAssetType: S3AssetType.FILE})) as any,
        new BehaviorSubject(makeRootState()) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.uploadStart({
        file,
        uploadItem: {
          _type: 'upload',
          assetType: S3AssetType.FILE,
          hash: expectedHash,
          name: 'photo.jpg',
          size: 3,
          status: 'queued',
        },
      }),
    ])

    result = await lastValueFrom(
      uploadsAssetUploadEpic(
        of(uploadsActions.uploadRequest({file})) as any,
        new BehaviorSubject(
          makeRootState({
            uploads: {
              allIds: [expectedHash],
              byIds: {
                [expectedHash]: makeUploadItem({hash: expectedHash}),
              },
            },
          }),
        ) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([])
  })

  it('uploadsAssetUploadEpic infers FILE for non-image mime types', async () => {
    const file = new File(['pdf'], 'doc.pdf', {
      type: 'application/pdf',
    }) as any

    const expectedHash = await getSha1Hash(file)

    const result = await lastValueFrom(
      uploadsAssetUploadEpic(
        of(uploadsActions.uploadRequest({file})) as any,
        new BehaviorSubject(makeRootState()) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.uploadStart({
        file,
        uploadItem: {
          _type: 'upload',
          assetType: S3AssetType.FILE,
          hash: expectedHash,
          name: 'doc.pdf',
          size: 3,
          status: 'queued',
        },
      }),
    ])
  })

  it('uploadsAssetUploadEpic infers VIDEO for video mime types', async () => {
    const file = new File(['video'], 'clip.mp4', {
      type: 'video/mp4',
    }) as any

    const expectedHash = await getSha1Hash(file)

    const result = await lastValueFrom(
      uploadsAssetUploadEpic(
        of(uploadsActions.uploadRequest({file})) as any,
        new BehaviorSubject(makeRootState()) as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([
      uploadsActions.uploadStart({
        file,
        uploadItem: {
          _type: 'upload',
          assetType: S3AssetType.VIDEO,
          hash: expectedHash,
          name: 'clip.mp4',
          size: 5,
          status: 'queued',
        },
      }),
    ])
  })

  it('uploadsCompleteQueueEpic emits checkRequest', async () => {
    const asset = makeImageAsset({sha1hash: 'hash-image'})

    const result = await lastValueFrom(
      uploadsCompleteQueueEpic(
        of(UPLOADS_ACTIONS.uploadComplete({asset})) as any,
        EMPTY as any,
        makeDeps(),
      ).pipe(toArray()),
    )

    expect(result).toEqual([uploadsActions.checkRequest({assets: [asset]})])
  })

  it('uploadsCheckRequestEpic emits checkComplete and insertUploads after delay', async () => {
    vi.useFakeTimers()

    const deps = makeDeps()
    const asset1 = makeImageAsset({_id: 'asset-1', sha1hash: 'hash-1'})
    const asset2 = makeImageAsset({_id: 'asset-2', sha1hash: 'hash-2'})

    deps.sanityClient.observable.fetch.mockReturnValue(of(['hash-1']))

    const resultPromise = lastValueFrom(
      uploadsCheckRequestEpic(
        of(uploadsActions.checkRequest({assets: [asset1, asset2]})) as any,
        new BehaviorSubject(
          makeRootState({
            assets: {assetTypes: [S3AssetType.IMAGE]},
            search: {query: 'cat'},
          }),
        ) as any,
        deps,
      ).pipe(toArray()),
    )

    await vi.advanceTimersByTimeAsync(1000)

    const result = await resultPromise

    expect(deps.sanityClient.observable.fetch).toHaveBeenCalledWith(expect.any(String), {
      documentIds: ['asset-1', 'asset-2'],
    })

    expect(result).toEqual([
      uploadsActions.checkComplete({
        results: {
          'hash-1': 'asset-1',
          'hash-2': null,
        },
      }),
      assetsActions.insertUploads({
        results: {
          'hash-1': 'asset-1',
          'hash-2': null,
        },
      }),
    ])
  })
})
