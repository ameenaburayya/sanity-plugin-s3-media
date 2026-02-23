import {lastValueFrom} from 'rxjs'

import {S3AssetType} from '../../../../types'
import * as validators from '../../validators'
import {AssetsClient, ObservableAssetsClient} from '../AssetsClient'

const baseConfig = {
  bucketRegion: 'us-east-1',
  bucketKey: 'bucket-key',
  getSignedUrlEndpoint: 'https://api.example.com/sign',
  deleteEndpoint: 'https://api.example.com/delete',
  secret: 'top-secret',
}

const createClient = (overrides: Record<string, unknown> = {}) => {
  return {
    config: vi.fn(() => ({...baseConfig, ...overrides})),
  }
}

const file = {
  size: 100,
  type: 'image/png',
} as File

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = []

  upload = {
    onprogress: null as null | ((event: any) => void),
  }
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  status = 200
  statusText = 'OK'
  method = ''
  url = ''
  requestHeaders: Record<string, string> = {}
  body: unknown

  constructor() {
    MockXMLHttpRequest.instances.push(this)
  }

  open = vi.fn((method: string, url: string) => {
    this.method = method
    this.url = url
  })

  setRequestHeader = vi.fn((name: string, value: string) => {
    this.requestHeaders[name] = value
  })

  send = vi.fn((body: unknown) => {
    this.body = body
  })
}

describe('AssetsClient upload', () => {
  beforeEach(() => {
    MockXMLHttpRequest.instances = []
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as any)
    vi.spyOn(URL, 'canParse').mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    [
      'bucketRegion',
      {bucketRegion: undefined},
      'S3Client: Missing required config field: bucketRegion',
    ],
    ['bucketKey', {bucketKey: undefined}, 'S3Client: Missing required config field: bucketKey'],
    [
      'getSignedUrlEndpoint',
      {getSignedUrlEndpoint: undefined},
      'S3Client: Missing required config field: getSignedUrlEndpoint',
    ],
    ['secret', {secret: undefined}, 'S3Client: Missing required config field: secret'],
  ])('throws when required config field %s is missing', (_field, overrides, message) => {
    const observableClient = new ObservableAssetsClient(createClient(overrides) as any)

    expect(() =>
      observableClient.uploadAsset({
        assetType: S3AssetType.IMAGE,
        file,
        fileName: 'photo.png',
      }),
    ).toThrow(message)
  })

  it('throws when fileName is missing', () => {
    const observableClient = new ObservableAssetsClient(createClient() as any)

    expect(() =>
      observableClient.uploadAsset({
        assetType: S3AssetType.IMAGE,
        file,
        fileName: '',
      }),
    ).toThrow('S3Client: filename is required in options')
  })

  it('validates assetType before upload', () => {
    const validationSpy = vi
      .spyOn(validators, 'validateAssetType')
      .mockImplementation(() => undefined)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    observableClient.uploadAsset({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: 'photo.png',
    })

    expect(validationSpy).toHaveBeenCalledWith(S3AssetType.IMAGE)
  })

  it('emits upload progress and response events on successful upload', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'https://s3.example.com/upload/photo.png'}),
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    const events: any[] = []
    const completion = new Promise<void>((resolve, reject) => {
      observableClient
        .uploadAsset({
          assetType: S3AssetType.IMAGE,
          file,
          fileName: 'photo.png',
        })
        .subscribe({
          next: (event) => events.push(event),
          error: reject,
          complete: resolve,
        })
    })

    await flush()

    const xhr = MockXMLHttpRequest.instances[0]
    expect(xhr).toBeDefined()

    xhr.upload.onprogress?.({lengthComputable: false, loaded: 0, total: 0})
    expect(events).toHaveLength(1)

    xhr.upload.onprogress?.({lengthComputable: true, loaded: 25, total: 100})

    xhr.status = 201
    xhr.statusText = 'Created'
    xhr.onload?.()

    await completion

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/sign',
      expect.objectContaining({
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'},
      }),
    )

    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as any).body)
    expect(requestBody).toEqual({
      secret: 'top-secret',
      fileName: 'photo.png',
      bucketKey: 'bucket-key',
      bucketRegion: 'us-east-1',
      contentType: 'image/png',
    })

    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://s3.example.com/upload/photo.png')
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/png')
    expect(xhr.send).toHaveBeenCalledWith(file)

    expect(events).toHaveLength(4)
    expect(events[0]).toMatchObject({type: 'progress', percent: 5, stage: 'upload'})
    expect(events[1]).toMatchObject({type: 'progress', stage: 'upload', loaded: 25, total: 100})
    expect(events[1].percent).toBeCloseTo(32.5)
    expect(events[2]).toMatchObject({type: 'progress', percent: 100, loaded: 100, total: 100})
    expect(events[3]).toEqual({
      type: 'response',
      method: 'PUT',
      statusCode: 201,
      statusMessage: 'Created',
      headers: {},
    })
  })

  it('treats missing file size as zero in progress events', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'https://s3.example.com/upload/empty.png'}),
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)
    const emptyFile = {size: 0, type: 'image/png'} as File

    const events: any[] = []
    const completion = new Promise<void>((resolve, reject) => {
      observableClient
        .uploadAsset({
          assetType: S3AssetType.IMAGE,
          file: emptyFile,
          fileName: 'empty.png',
        })
        .subscribe({
          next: (event) => events.push(event),
          error: reject,
          complete: resolve,
        })
    })

    await flush()

    const xhr = MockXMLHttpRequest.instances[0]
    xhr.status = 200
    xhr.statusText = 'OK'
    xhr.onload?.()

    await completion

    expect(events[0]).toMatchObject({type: 'progress', total: 0, loaded: 0})
    expect(events[1]).toMatchObject({type: 'progress', total: 0, loaded: 0, percent: 100})
  })

  it('errors when signed URL endpoint returns an invalid URL', async () => {
    vi.spyOn(URL, 'canParse').mockReturnValue(false)

    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'invalid-url'}),
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    await expect(
      lastValueFrom(
        observableClient.uploadAsset({
          assetType: S3AssetType.IMAGE,
          file,
          fileName: 'photo.png',
        }),
      ),
    ).rejects.toThrow('Invalid signed URL received from endpoint')

    expect(MockXMLHttpRequest.instances).toHaveLength(0)
  })

  it('errors when signed URL request fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockRejectedValue(new Error('signing endpoint unavailable'))

    const observableClient = new ObservableAssetsClient(createClient() as any)

    await expect(
      lastValueFrom(
        observableClient.uploadAsset({
          assetType: S3AssetType.IMAGE,
          file,
          fileName: 'photo.png',
        }),
      ),
    ).rejects.toThrow('signing endpoint unavailable')
  })

  it('errors when S3 upload returns a non-2xx status', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'https://s3.example.com/upload/photo.png'}),
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    const promise = lastValueFrom(
      observableClient.uploadAsset({
        assetType: S3AssetType.IMAGE,
        file,
        fileName: 'photo.png',
      }),
    )

    await flush()

    const xhr = MockXMLHttpRequest.instances[0]
    xhr.status = 403
    xhr.statusText = 'Forbidden'
    xhr.onload?.()

    await expect(promise).rejects.toThrow('S3 upload failed: 403 Forbidden')
  })

  it('errors on xhr network failures', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'https://s3.example.com/upload/photo.png'}),
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    const promise = lastValueFrom(
      observableClient.uploadAsset({
        assetType: S3AssetType.IMAGE,
        file,
        fileName: 'photo.png',
      }),
    )

    await flush()

    const xhr = MockXMLHttpRequest.instances[0]
    xhr.onerror?.()

    await expect(promise).rejects.toThrow('S3 upload failed: Network error')
  })

  it('returns only the final response event from promise-based uploadAsset', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({url: 'https://s3.example.com/upload/photo.png'}),
    } as any)

    const client = new AssetsClient(createClient() as any)

    const promise = client.uploadAsset({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: 'photo.png',
    })

    await flush()

    const xhr = MockXMLHttpRequest.instances[0]
    xhr.upload.onprogress?.({lengthComputable: true, loaded: 30, total: 100})
    xhr.status = 200
    xhr.statusText = 'OK'
    xhr.onload?.()

    await expect(promise).resolves.toEqual({
      type: 'response',
      method: 'PUT',
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
    })
  })
})

describe('AssetsClient delete', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws when deleteEndpoint is missing', () => {
    const observableClient = new ObservableAssetsClient(
      createClient({deleteEndpoint: undefined}) as any,
    )

    expect(() => observableClient.deleteAsset({fileName: 'photo.png'})).toThrow(
      'S3Client: Missing required config field: deleteEndpoint',
    )
  })

  it('throws when fileName is missing', () => {
    const observableClient = new ObservableAssetsClient(createClient() as any)

    expect(() => observableClient.deleteAsset({fileName: ''})).toThrow(
      'S3Client: fileKey is required in options',
    )
  })

  it('emits response event when delete succeeds', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    await expect(lastValueFrom(observableClient.deleteAsset({fileName: 'photo.png'}))).resolves.toEqual(
      {
        type: 'response',
        method: 'POST',
        statusCode: 204,
        statusMessage: 'No Content',
        headers: {},
      },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/delete',
      expect.objectContaining({
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'},
      }),
    )

    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as any).body)
    expect(requestBody).toEqual({
      fileKey: 'photo.png',
      secret: 'top-secret',
      bucketKey: 'bucket-key',
      bucketRegion: 'us-east-1',
    })
  })

  it('errors when delete endpoint responds with non-ok status', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any)

    const observableClient = new ObservableAssetsClient(createClient() as any)

    await expect(lastValueFrom(observableClient.deleteAsset({fileName: 'photo.png'}))).rejects.toThrow(
      'S3 delete failed: 500 Internal Server Error',
    )
  })

  it('errors when delete request throws', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockRejectedValue(new Error('delete endpoint unavailable'))

    const observableClient = new ObservableAssetsClient(createClient() as any)

    await expect(lastValueFrom(observableClient.deleteAsset({fileName: 'photo.png'}))).rejects.toThrow(
      'delete endpoint unavailable',
    )
  })

  it('returns final response event from promise-based deleteAsset', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as any)

    const client = new AssetsClient(createClient() as any)

    await expect(client.deleteAsset({fileName: 'photo.png'})).resolves.toEqual({
      type: 'response',
      method: 'POST',
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
    })
  })
})
