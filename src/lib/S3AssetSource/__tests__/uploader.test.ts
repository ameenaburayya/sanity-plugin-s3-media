import {Observable, of} from 'rxjs'
import type {
  AssetSourceUploadEvent,
  SanityClient,
  SchemaType,
} from 'sanity'
import type {Mock} from 'vitest'

import {type S3Client} from '../../S3Client'
import {createS3Uploader} from '../uploader'

const uuidMock = vi.hoisted(() => vi.fn())

vi.mock('@sanity/uuid', () => ({
  uuid: uuidMock,
}))

type SanityTypeMock = {
  _isType: Mock
}

const {_isType: isTypeMock} = (globalThis as {__sanityMock: SanityTypeMock}).__sanityMock

describe('createS3Uploader', () => {
  type MockSanityClient = Pick<SanityClient, 'observable'>
  type MockS3Client = Pick<S3Client, 'observable'>

  const createSanityClient = (props: {
    fetch: unknown
    create: unknown
  }): MockSanityClient =>
    ({
      observable: {
        fetch: props.fetch,
        create: props.create,
      },
    }) as unknown as MockSanityClient

  const createS3Client = (props: {
    uploadAsset: unknown
  }): MockS3Client =>
    ({
      observable: {
        assets: {
          uploadAsset: props.uploadAsset,
        },
      },
    }) as unknown as MockS3Client

  const buildDeps = () => {
    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: 's3File-createdasset-pdf',
        _type: 's3FileAsset',
        assetId: 'createdasset',
        extension: 'pdf',
        mimeType: 'application/pdf',
        sha1hash: 'createdasset',
        size: 2,
      }),
    )

    const uploadAsset = vi.fn(() => of({type: 'response'}))

    return {
      sanityClient: createSanityClient({
        fetch,
        create,
      }),
      s3Client: createS3Client({
        uploadAsset,
      }),
      fetch,
      create,
      uploadAsset,
    }
  }

  const makeUploader = (overrides?: {
    sanityClient?: unknown
    s3Client?: unknown
  }) => {
    const deps = buildDeps()
    const sanityClient = overrides?.sanityClient || deps.sanityClient
    const s3Client = overrides?.s3Client || deps.s3Client

    const Uploader = createS3Uploader({
      sanityClient: sanityClient as unknown as SanityClient,
      s3Client: s3Client as unknown as S3Client,
    })

    return {uploader: new Uploader(), deps}
  }

  beforeEach(() => {
    isTypeMock.mockImplementation(
      (schemaType: {name?: string}, schemaTypeName: string) => schemaType?.name === schemaTypeName,
    )
  })

  it('throws when schemaType or onChange are missing', () => {
    uuidMock.mockReturnValue('file-missing')

    const {uploader} = makeUploader()
    const file = new File(['x'], 'missing.txt', {type: 'text/plain'})

    expect(() => uploader.upload([file], undefined)).toThrow(
      'No schema type provided for file upload',
    )

    expect(() => uploader.upload([file], {onChange: vi.fn()})).toThrow(
      'No schema type provided for file upload',
    )

    expect(() =>
      uploader.upload([file], {schemaType: {name: 's3File'} as SchemaType}),
    ).toThrow('No onChange provided for file upload')
  })

  it('handles successful upload lifecycle and emits all-complete', async () => {
    uuidMock.mockReturnValue('file-1')

    const {uploader, deps} = makeUploader()
    const onChange = vi.fn()
    const events: AssetSourceUploadEvent[] = []

    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['ok'], 'photo.pdf', {type: 'application/pdf'})], {
      schemaType: {name: 's3File', options: {storeOriginalFilename: false}} as SchemaType,
      onChange,
    })

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalled()
      expect(uploader.getFiles()).toEqual([])
    })

    expect(deps.uploadAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetType: 's3File',
        file: expect.any(File),
      }),
    )

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({type: 'status', status: 'uploading'}),
        expect.objectContaining({type: 'status', status: 'complete'}),
        expect.objectContaining({type: 'all-complete'}),
      ]),
    )
  })

  it('normalizes unknown upload errors and emits error event', async () => {
    uuidMock.mockReturnValue('file-err')

    const {uploader, deps} = makeUploader({
      s3Client: {
        observable: {
          assets: {
            uploadAsset: vi.fn(
              () =>
                new Observable((subscriber) => {
                  subscriber.error('unexpected')
                }),
            ),
          },
        },
      },
    })

    const events: AssetSourceUploadEvent[] = []

    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['bad'], 'broken.pdf', {type: 'application/pdf'})], {
      schemaType: {name: 's3File'} as SchemaType,
      onChange: vi.fn(),
    })

    await vi.waitFor(() => {
      expect(events.some((event) => event.type === 'status' && event.status === 'error')).toBe(true)
    })

    expect(deps.fetch).toHaveBeenCalled()

    const statusEvent = events.find((event) => event.type === 'status' && event.status === 'error') as (AssetSourceUploadEvent & {type: 'status'; file: {error?: Error}}) | undefined

    expect(statusEvent!.file.error).toBeInstanceOf(Error)
    expect(statusEvent!.file.error!.message).toBe('Unknown error')

    const errorEvent = events.find((event) => event.type === 'error') as (AssetSourceUploadEvent & {type: 'error'; files: unknown[]}) | undefined

    expect(errorEvent!.files).toEqual([])
  })

  it('preserves Error instances from upload failures', async () => {
    uuidMock.mockReturnValue('file-error-instance')

    const {uploader} = makeUploader({
      s3Client: {
        observable: {
          assets: {
            uploadAsset: vi.fn(
              () =>
                new Observable((subscriber) => {
                  subscriber.error(new Error('explicit upload failure'))
                }),
            ),
          },
        },
      },
    })

    const events: AssetSourceUploadEvent[] = []

    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['bad'], 'broken-again.pdf', {type: 'application/pdf'})], {
      schemaType: {name: 's3File'} as SchemaType,
      onChange: vi.fn(),
    })

    await vi.waitFor(() => {
      expect(events.some((event) => event.type === 'status' && event.status === 'error')).toBe(true)
    })

    const statusEvent = events.find((event) => event.type === 'status' && event.status === 'error') as (AssetSourceUploadEvent & {type: 'status'; file: {error?: Error}}) | undefined

    expect(statusEvent!.file.error).toBeInstanceOf(Error)
    expect(statusEvent!.file.error!.message).toBe('explicit upload failure')
  })

  it('aborts a single file and then aborts all remaining files', () => {
    uuidMock.mockReturnValueOnce('file-1').mockReturnValueOnce('file-2')

    const {uploader} = makeUploader()
    const events: AssetSourceUploadEvent[] = []

    uploader.subscribe((event) => events.push(event))

    const files = uploader.upload(
      [
        new File(['a'], 'first.txt', {type: 'text/plain'}),
        new File(['b'], 'second.txt', {type: 'text/plain'}),
      ],
      {schemaType: {name: 'unsupportedType'} as SchemaType, onChange: vi.fn()},
    )

    uploader.abort(files[0])
    expect(files[0].status).toBe('aborted')
    expect(files[1].status).toBe('pending')

    uploader.abort()
    expect(uploader.getFiles()).toEqual([])

    const abortEvents = events.filter((event) => event.type === 'abort')

    expect(abortEvents).toHaveLength(2)
    expect(events).toEqual(
      expect.arrayContaining([expect.objectContaining({type: 'all-complete'})]),
    )
  })

  it('replays current file state to new subscribers and supports unsubscribe', () => {
    uuidMock.mockReturnValue('file-sub')

    const {uploader} = makeUploader()

    uploader.upload([new File(['c'], 'queued.txt', {type: 'text/plain'})], {
      schemaType: {name: 'unsupportedType'} as SchemaType,
      onChange: vi.fn(),
    })

    const subscriber = vi.fn()
    const unsubscribe = uploader.subscribe(subscriber)

    expect(subscriber).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({type: 'status', status: 'pending'}),
    )
    expect(subscriber).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({type: 'progress', progress: 0}),
    )

    unsubscribe()
    uploader.updateFile('file-sub', {status: 'aborted'})

    expect(subscriber).toHaveBeenCalledTimes(2)
  })

  it('emits progress percentages when updateFile receives a progress delta', () => {
    uuidMock.mockReturnValue('file-progress')

    const {uploader} = makeUploader()
    const events: AssetSourceUploadEvent[] = []

    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['d'], 'progress.txt', {type: 'text/plain'})], {
      schemaType: {name: 'unsupportedType'} as SchemaType,
      onChange: vi.fn(),
    })

    uploader.updateFile('file-progress', {progress: 0.3})

    const progressEvent = events.find((event) => event.type === 'progress' && event.progress === 30)

    expect(progressEvent).toEqual(
      expect.objectContaining({
        type: 'progress',
        progress: 30,
      }),
    )
  })

  it('unsubscribes tracked subscriptions for async error and complete callbacks', async () => {
    vi.useFakeTimers()
    uuidMock.mockReturnValueOnce('file-async-error').mockReturnValueOnce('file-async-complete')

    const uploadAsset = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.error(new Error('async boom'))
            }, 1)

            return () => clearTimeout(timeout)
          }),
      )
      .mockImplementationOnce(
        () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.next({type: 'response'})
              subscriber.complete()
            }, 1)

            return () => clearTimeout(timeout)
          }),
      )

    const {uploader} = makeUploader({
      s3Client: {
        observable: {
          assets: {uploadAsset},
        },
      },
    })

    uploader.upload([new File(['a'], 'a.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as SchemaType,
      onChange: vi.fn(),
    })
    uploader.upload([new File(['b'], 'b.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as SchemaType,
      onChange: vi.fn(),
    })

    await vi.advanceTimersByTimeAsync(5)

    await vi.waitFor(() => {
      expect(uploader.getFiles()).toEqual([])
    })
  })
})
