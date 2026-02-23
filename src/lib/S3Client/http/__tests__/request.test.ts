import {lastValueFrom, of} from 'rxjs'

import {defineHttpRequest} from '../request'

const {createFetchClientMock, fetchClientMock} = vi.hoisted(() => {
  return {
    createFetchClientMock: vi.fn(),
    fetchClientMock: vi.fn(),
  }
})

vi.mock('../fetchClient', () => {
  return {
    createFetchClient: createFetchClientMock,
  }
})

describe('defineHttpRequest', () => {
  beforeEach(() => {
    createFetchClientMock.mockReset()
    fetchClientMock.mockReset()
    createFetchClientMock.mockReturnValue(fetchClientMock)
  })

  it('applies default timeout/maxRetries/retryDelay when omitted', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {},
      }),
    )

    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/items'}))

    expect(fetchClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/items',
        timeout: 300000,
        maxRetries: 3,
        retryDelay: 1000,
      }),
    )
  })

  it('preserves explicit timeout and maxRetries values', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {},
      }),
    )

    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/items', timeout: 2000, maxRetries: 0}))

    expect(fetchClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 2000,
        maxRetries: 0,
      }),
    )
  })

  it('warns once per unique warning message across requests', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {'x-sanity-warning': 'be careful'},
      }),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/one'}))
    await lastValueFrom(request({url: 'https://api.example.com/two'}))

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('be careful')
  })

  it('handles warning arrays and skips falsy warning entries', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {'x-sanity-warning': ['warn-a', '', 'warn-b']},
      } as any),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/array'}))

    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenNthCalledWith(1, 'warn-a')
    expect(warnSpy).toHaveBeenNthCalledWith(2, 'warn-b')
  })

  it('does not warn for non-response events', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'progress',
        stage: 'upload',
        percent: 25,
        loaded: 25,
        total: 100,
        lengthComputable: true,
      } as any),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/progress'}))

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('ignores warnings matching string and regex ignore patterns', async () => {
    fetchClientMock
      .mockReturnValueOnce(
        of({
          type: 'response',
          method: 'GET',
          statusCode: 200,
          statusMessage: 'OK',
          headers: {'x-sanity-warning': 'please ignore-this warning'},
        }),
      )
      .mockReturnValueOnce(
        of({
          type: 'response',
          method: 'GET',
          statusCode: 200,
          statusMessage: 'OK',
          headers: {'x-sanity-warning': 'warn-42'},
        }),
      )
      .mockReturnValueOnce(
        of({
          type: 'response',
          method: 'GET',
          statusCode: 200,
          statusMessage: 'OK',
          headers: {'x-sanity-warning': 'warn-me'},
        }),
      )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest({
      ignoreWarnings: ['ignore-this', /warn-\d+/, {unsupported: true} as any],
    })

    await lastValueFrom(request({url: 'https://api.example.com/ignore-1'}))
    await lastValueFrom(request({url: 'https://api.example.com/ignore-2'}))
    await lastValueFrom(request({url: 'https://api.example.com/ignore-3'}))

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('warn-me')
  })

  it('supports a single ignoreWarnings pattern without array wrapping in caller code', async () => {
    fetchClientMock.mockReturnValue(
      of({
        type: 'response',
        method: 'GET',
        statusCode: 200,
        statusMessage: 'OK',
        headers: {'x-sanity-warning': 'single-ignore-pattern'},
      }),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest({ignoreWarnings: 'single-ignore'})

    await lastValueFrom(request({url: 'https://api.example.com/single-ignore'}))

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
