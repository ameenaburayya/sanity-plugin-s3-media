import {Observable, of} from 'rxjs'

import {createS3Uploader} from '../uploader'

const uuidMock = vi.hoisted(() => vi.fn())
const resolveUploaderBySchemaTypeMock = vi.hoisted(() => vi.fn())

vi.mock('@sanity/uuid', () => ({
  uuid: uuidMock,
}))

vi.mock('../resolveUploader', () => ({
  resolveUploaderBySchemaType: resolveUploaderBySchemaTypeMock,
}))

describe('createS3Uploader', () => {
  const sanityClient = {id: 'sanity'}
  const s3Client = {id: 's3'}

  const makeUploader = () => {
    const Uploader = createS3Uploader({sanityClient, s3Client} as any)
    return new Uploader()
  }

  it('throws when schemaType or onChange are missing', () => {
    const uploader = makeUploader()

    const file = new File(['x'], 'missing.txt', {type: 'text/plain'})

    expect(() => uploader.upload([file], undefined as any)).toThrow(
      'No schema type provided for file upload',
    )

    expect(() => uploader.upload([file], {onChange: vi.fn()} as any)).toThrow(
      'No schema type provided for file upload',
    )

    expect(() => uploader.upload([file], {schemaType: {name: 's3File'}} as any)).toThrow(
      'No onChange provided for file upload',
    )
  })

  it('handles successful upload lifecycle and emits all-complete', () => {
    uuidMock.mockReturnValue('file-1')

    const upload = vi.fn(() =>
      of(
        {patches: [{op: 'set'}]},
        {patches: null},
      ),
    )

    resolveUploaderBySchemaTypeMock.mockReturnValue({upload})

    const uploader = makeUploader()
    const onChange = vi.fn()
    const events: any[] = []
    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['ok'], 'photo.png', {type: 'image/png'})], {
      schemaType: {name: 's3Image', options: {storeOriginalFilename: false}} as any,
      onChange,
    })

    expect(upload).toHaveBeenCalledWith({
      file: expect.any(File),
      sanityClient,
      s3Client,
      options: {storeOriginalFilename: false},
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([{op: 'set'}])

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({type: 'status', status: 'uploading'}),
        expect.objectContaining({type: 'status', status: 'complete'}),
        expect.objectContaining({type: 'all-complete'}),
      ]),
    )

    expect(uploader.getFiles()).toEqual([])
  })

  it('normalizes unknown upload errors and emits error event', () => {
    uuidMock.mockReturnValue('file-err')

    const upload = vi.fn(
      () =>
        new Observable((subscriber) => {
          subscriber.error('unexpected')
        }),
    )

    resolveUploaderBySchemaTypeMock.mockReturnValue({upload})

    const uploader = makeUploader()
    const events: any[] = []
    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['bad'], 'broken.png', {type: 'image/png'})], {
      schemaType: {name: 's3Image'} as any,
      onChange: vi.fn(),
    })

    const statusEvent = events.find((event) => event.type === 'status' && event.status === 'error')
    expect(statusEvent.file.error).toBeInstanceOf(Error)
    expect(statusEvent.file.error.message).toBe('Unknown error')

    const errorEvent = events.find((event) => event.type === 'error')
    expect(errorEvent.files).toEqual([])
  })

  it('preserves Error instances from upload failures', () => {
    uuidMock.mockReturnValue('file-error-instance')

    const upload = vi.fn(
      () =>
        new Observable((subscriber) => {
          subscriber.error(new Error('explicit upload failure'))
        }),
    )

    resolveUploaderBySchemaTypeMock.mockReturnValue({upload})

    const uploader = makeUploader()
    const events: any[] = []
    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['bad'], 'broken-again.png', {type: 'image/png'})], {
      schemaType: {name: 's3Image'} as any,
      onChange: vi.fn(),
    })

    const statusEvent = events.find((event) => event.type === 'status' && event.status === 'error')
    expect(statusEvent.file.error).toBeInstanceOf(Error)
    expect(statusEvent.file.error.message).toBe('explicit upload failure')
  })

  it('aborts a single file and then aborts all remaining files', () => {
    uuidMock.mockReturnValueOnce('file-1').mockReturnValueOnce('file-2')
    resolveUploaderBySchemaTypeMock.mockReturnValue(null)

    const uploader = makeUploader()
    const events: any[] = []
    uploader.subscribe((event) => events.push(event))

    const files = uploader.upload(
      [
        new File(['a'], 'first.txt', {type: 'text/plain'}),
        new File(['b'], 'second.txt', {type: 'text/plain'}),
      ],
      {schemaType: {name: 's3File'} as any, onChange: vi.fn()},
    )

    uploader.abort(files[0])
    expect(files[0].status).toBe('aborted')
    expect(files[1].status).toBe('pending')

    uploader.abort()
    expect(uploader.getFiles()).toEqual([])

    const abortEvents = events.filter((event) => event.type === 'abort')
    expect(abortEvents).toHaveLength(2)
    expect(events).toEqual(expect.arrayContaining([expect.objectContaining({type: 'all-complete'})]))
  })

  it('replays current file state to new subscribers and supports unsubscribe', () => {
    uuidMock.mockReturnValue('file-sub')
    resolveUploaderBySchemaTypeMock.mockReturnValue(null)

    const uploader = makeUploader()

    uploader.upload([new File(['c'], 'queued.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as any,
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
    resolveUploaderBySchemaTypeMock.mockReturnValue(null)

    const uploader = makeUploader()
    const events: any[] = []
    uploader.subscribe((event) => events.push(event))

    uploader.upload([new File(['d'], 'progress.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as any,
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

    resolveUploaderBySchemaTypeMock
      .mockReturnValueOnce({
        upload: () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.error(new Error('async boom'))
            }, 1)
            return () => clearTimeout(timeout)
          }),
      })
      .mockReturnValueOnce({
        upload: () =>
          new Observable((subscriber) => {
            const timeout = setTimeout(() => {
              subscriber.complete()
            }, 1)
            return () => clearTimeout(timeout)
          }),
      })

    const uploader = makeUploader()

    uploader.upload([new File(['a'], 'a.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as any,
      onChange: vi.fn(),
    })
    uploader.upload([new File(['b'], 'b.txt', {type: 'text/plain'})], {
      schemaType: {name: 's3File'} as any,
      onChange: vi.fn(),
    })

    await vi.advanceTimersByTimeAsync(5)
    expect(uploader.getFiles()).toEqual([])
  })
})
