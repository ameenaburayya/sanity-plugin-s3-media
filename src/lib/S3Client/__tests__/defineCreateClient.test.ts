import {of} from 'rxjs'

import defineCreateClientExports from '../defineCreateClient'

const {defineHttpRequestMock, defaultRequesterMock} = vi.hoisted(() => {
  return {
    defineHttpRequestMock: vi.fn(),
    defaultRequesterMock: vi.fn(),
  }
})

vi.mock('../http/request', () => {
  return {
    defineHttpRequest: defineHttpRequestMock,
  }
})

class FakeClient {
  httpRequest: any
  config: any

  constructor(httpRequest: any, config: any) {
    this.httpRequest = httpRequest
    this.config = config
  }
}

describe('defineCreateClientExports', () => {
  beforeEach(() => {
    defineHttpRequestMock.mockReset()
    defaultRequesterMock.mockReset()

    defaultRequesterMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {},
      }),
    )
    defineHttpRequestMock.mockReturnValue(defaultRequesterMock)
  })

  it('creates clients that use defineHttpRequest requester by default', () => {
    const {createClient} = defineCreateClientExports(FakeClient)
    const config = {bucketKey: 'bucket', getSignedUrlEndpoint: 'https://api.example.com/sign'}

    const client = createClient(config as any)

    expect(defineHttpRequestMock).toHaveBeenCalledTimes(1)
    expect(client).toBeInstanceOf(FakeClient)
    expect(client.config).toEqual(config)

    const options = {url: 'https://api.example.com/items'}
    client.httpRequest(options)

    expect(defaultRequesterMock).toHaveBeenCalledWith(options)
  })

  it('prefers requester override when provided', () => {
    const {createClient} = defineCreateClientExports(FakeClient)
    const client = createClient({bucketKey: 'bucket'} as any)

    const overrideRequester = vi.fn().mockReturnValue('override-result')
    const options = {url: 'https://api.example.com/override'}

    const result = client.httpRequest(options, overrideRequester)

    expect(overrideRequester).toHaveBeenCalledWith(options)
    expect(defaultRequesterMock).not.toHaveBeenCalled()
    expect(result).toBe('override-result')
  })

  it('creates a new default requester for each created client', () => {
    const firstRequester = vi.fn().mockReturnValue('first')
    const secondRequester = vi.fn().mockReturnValue('second')

    defineHttpRequestMock.mockReset()
    defineHttpRequestMock.mockReturnValueOnce(firstRequester).mockReturnValueOnce(secondRequester)

    const {createClient} = defineCreateClientExports(FakeClient)

    const firstClient = createClient({bucketKey: 'one'} as any)
    const secondClient = createClient({bucketKey: 'two'} as any)

    firstClient.httpRequest({url: 'https://api.example.com/1'})
    secondClient.httpRequest({url: 'https://api.example.com/2'})

    expect(defineHttpRequestMock).toHaveBeenCalledTimes(2)
    expect(firstRequester).toHaveBeenCalledTimes(1)
    expect(secondRequester).toHaveBeenCalledTimes(1)
  })
})
