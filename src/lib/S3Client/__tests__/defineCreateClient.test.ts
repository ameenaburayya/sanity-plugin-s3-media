import {lastValueFrom} from 'rxjs'

import defineCreateClientExports from '../defineCreateClient'

class FakeClient {
  httpRequest: any
  config: any

  constructor(httpRequest: any, config: any) {
    this.httpRequest = httpRequest
    this.config = config
  }
}

const createFetchResponse = (
  status: number,
  statusText: string,
  headers: Record<string, unknown> = {},
) => ({
  status,
  statusText,
  headers: {
    entries: () => Object.entries(headers),
  },
  json: () => Promise.resolve({}),
})

describe('defineCreateClientExports', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(createFetchResponse(200, 'OK')) as any))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates clients that use defineHttpRequest requester by default', async () => {
    const {createClient} = defineCreateClientExports(FakeClient)
    const config = {bucketKey: 'bucket', getSignedUrlEndpoint: 'https://api.example.com/sign'}

    const client = createClient(config as any)

    expect(client).toBeInstanceOf(FakeClient)
    expect(client.config).toEqual(config)

    const options = {url: 'https://api.example.com/items'}
    const responseEvent = await lastValueFrom(client.httpRequest(options))

    expect(responseEvent).toEqual(
      expect.objectContaining({
        type: 'response',
        statusCode: 200,
        statusMessage: 'OK',
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({method: 'GET'}),
    )
  })

  it('prefers requester override when provided', () => {
    const {createClient} = defineCreateClientExports(FakeClient)
    const client = createClient({bucketKey: 'bucket'} as any)

    const overrideRequester = vi.fn().mockReturnValue('override-result')
    const options = {url: 'https://api.example.com/override'}

    const result = client.httpRequest(options, overrideRequester)

    expect(overrideRequester).toHaveBeenCalledWith(options)
    expect(fetch).not.toHaveBeenCalled()
    expect(result).toBe('override-result')
  })

  it('creates a new default requester for each created client', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          createFetchResponse(200, 'OK', {
            'x-sanity-warning': 'warn-once-per-client',
          }),
        ) as any,
      ),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const {createClient} = defineCreateClientExports(FakeClient)

    const firstClient = createClient({bucketKey: 'one'} as any)
    const secondClient = createClient({bucketKey: 'two'} as any)

    await lastValueFrom(firstClient.httpRequest({url: 'https://api.example.com/1'}))
    await lastValueFrom(firstClient.httpRequest({url: 'https://api.example.com/1-again'}))
    await lastValueFrom(secondClient.httpRequest({url: 'https://api.example.com/2'}))

    expect(warnSpy).toHaveBeenCalledTimes(2)
  })
})
