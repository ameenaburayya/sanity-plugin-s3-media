import {lastValueFrom} from 'rxjs'

import {defineHttpRequest} from '../request'

const createFetchResponse = (
  status: number,
  statusMessage: string,
  headers: Record<string, unknown> = {},
) => ({
  status,
  statusText: statusMessage,
  headers: {
    entries: () => Object.entries(headers),
  },
  json: () => Promise.resolve({}),
})

describe('defineHttpRequest', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('applies default timeout and retries with default retryDelay when omitted', async () => {
    vi.useFakeTimers()

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createFetchResponse(503, 'Service Unavailable'))
        .mockResolvedValueOnce(createFetchResponse(200, 'OK')),
    )

    const request = defineHttpRequest()

    const responsePromise = lastValueFrom(request({url: 'https://api.example.com/items'}))
    await vi.advanceTimersByTimeAsync(1000)
    await responsePromise

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300000)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
  })

  it('preserves explicit timeout and maxRetries values', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createFetchResponse(429, 'Too Many Requests')))

    const request = defineHttpRequest()

    await expect(
      lastValueFrom(request({url: 'https://api.example.com/items', timeout: 2000, maxRetries: 0})),
    ).rejects.toThrow('HTTP 429')

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
  })

  it('warns once per unique warning message across requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createFetchResponse(200, 'OK', {
          'x-sanity-warning': 'be careful',
        }),
      ),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/one'}))
    await lastValueFrom(request({url: 'https://api.example.com/two'}))

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('be careful')
  })

  it('handles warning arrays and skips falsy warning entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...createFetchResponse(200, 'OK'),
        headers: {
          entries: () => [['x-sanity-warning', ['warn-a', '', 'warn-b']]],
        },
      }),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest()

    await lastValueFrom(request({url: 'https://api.example.com/array'}))

    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenNthCalledWith(1, 'warn-a')
    expect(warnSpy).toHaveBeenNthCalledWith(2, 'warn-b')
  })

  it('ignores warnings matching string and regex ignore patterns', async () => {
    vi.stubGlobal('fetch', vi.fn())

    ;(fetch as any)
      .mockResolvedValueOnce(
        createFetchResponse(200, 'OK', {
          'x-sanity-warning': 'please ignore-this warning',
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse(200, 'OK', {
          'x-sanity-warning': 'warn-42',
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse(200, 'OK', {
          'x-sanity-warning': 'warn-me',
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createFetchResponse(200, 'OK', {
          'x-sanity-warning': 'single-ignore-pattern',
        }),
      ),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const request = defineHttpRequest({ignoreWarnings: 'single-ignore'})

    await lastValueFrom(request({url: 'https://api.example.com/single-ignore'}))

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
