import {lastValueFrom} from 'rxjs'

import type {JsonValue} from '../../types'
import {ClientError, ServerError} from '../errors'
import {createFetchClient} from '../fetchClient'

const createResponse = ({
  status = 200,
  statusText = 'OK',
  headers = {},
  body = {},
  jsonReject = false,
}: {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: JsonValue
  jsonReject?: boolean
} = {}) =>
  ({
    status,
    statusText,
    headers: new Headers(headers),
    json: jsonReject
      ? vi.fn().mockRejectedValue(new Error('invalid-json'))
      : vi.fn().mockResolvedValue(body),
  }) as unknown as Response

describe('createFetchClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('performs successful requests with default method and emits response events', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockResolvedValue(
      createResponse({
        status: 200,
        statusText: 'OK',
        headers: {'x-response-id': '123'},
        body: {ok: true},
      }),
    )

    const request = createFetchClient()

    const event = await lastValueFrom(request({url: 'https://api.example.com/ping'}))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/ping',
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    )
    expect(event).toEqual({
      type: 'response',
      method: 'GET',
      statusCode: 200,
      statusMessage: 'OK',
      headers: {'x-response-id': '123'},
      body: {ok: true},
      url: 'https://api.example.com/ping',
    })
  })

  it('serializes request body, respects provided signal, and falls back to empty json body', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockResolvedValue(
      createResponse({
        status: 201,
        statusText: 'Created',
        headers: {'x-status': 'created'},
        jsonReject: true,
      }),
    )

    const signalController = new AbortController()
    const request = createFetchClient()

    const event = await lastValueFrom(
      request({
        url: 'https://api.example.com/items',
        method: 'POST',
        headers: {'x-custom': '1'},
        signal: signalController.signal,
        body: {name: 'example'},
      }),
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({
        method: 'POST',
        signal: signalController.signal,
        body: JSON.stringify({name: 'example'}),
        headers: {
          'x-custom': '1',
          'Content-Type': 'application/json',
        },
      }),
    )
    expect((event as {body?: JsonValue}).body).toEqual({})
  })

  it('wraps missing-url errors in a standard failure message', async () => {
    const request = createFetchClient()

    await expect(lastValueFrom(request({}))).rejects.toThrow(
      'HTTP request failed: Error: URL is required for fetch request',
    )
  })

  it('throws ClientError for 4xx responses', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockResolvedValue(
      createResponse({
        status: 400,
        statusText: 'Bad Request',
        headers: {'content-type': 'application/json'},
        body: {
          error: 'Bad Request',
          message: 'Invalid payload',
        },
      }),
    )

    const request = createFetchClient()

    await expect(
      lastValueFrom(request({url: 'https://api.example.com/items'})),
    ).rejects.toBeInstanceOf(ClientError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({method: 'GET'}),
    )
  })

  it('throws ServerError for non-retriable 5xx responses', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockResolvedValue(
      createResponse({
        status: 500,
        statusText: 'Internal Server Error',
        body: {
          error: {
            description: 'Database unavailable',
          },
        },
      }),
    )

    const request = createFetchClient()

    await expect(
      lastValueFrom(request({url: 'https://api.example.com/items'})),
    ).rejects.toBeInstanceOf(ServerError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({method: 'GET'}),
    )
  })

  it('retries 502/503 responses and succeeds when a later attempt succeeds', async () => {
    vi.useFakeTimers()

    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          status: 502,
          statusText: 'Bad Gateway',
          body: {error: 'upstream down'},
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          statusText: 'OK',
          body: {ok: true},
        }),
      )

    const request = createFetchClient()
    const promise = lastValueFrom(request({url: 'https://api.example.com/retry', maxRetries: 2}))

    await vi.runAllTimersAsync()

    const event = await promise

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/retry',
      expect.objectContaining({method: 'GET'}),
    )
    expect((event as {statusCode?: number}).statusCode).toBe(200)
  })

  it('retries 429 responses and then fails with ClientError when max retries are exceeded', async () => {
    vi.useFakeTimers()

    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockResolvedValue(
      createResponse({
        status: 429,
        statusText: 'Too Many Requests',
        body: {error: 'Rate limited'},
      }),
    )

    const request = createFetchClient()
    const promise = lastValueFrom(
      request({url: 'https://api.example.com/rate-limit', maxRetries: 1}),
    )
    const handledRejection = promise.then(
      () => undefined,
      (error) => error,
    )

    await vi.runAllTimersAsync()

    const error = await handledRejection

    expect(error).toBeInstanceOf(ClientError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/rate-limit',
      expect.objectContaining({method: 'GET'}),
    )
  })

  it('wraps unexpected fetch exceptions in a standard error', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockRejectedValue(new TypeError('network-failed'))

    const request = createFetchClient()

    await expect(lastValueFrom(request({url: 'https://api.example.com/items'}))).rejects.toThrow(
      'HTTP request failed: TypeError: network-failed',
    )
  })

  it('aborts in-flight requests when the subscription is unsubscribed', () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockImplementation(
      () =>
        new Promise<Response>(() => {
          // Keep promise pending so unsubscribe executes cleanup before completion
          void 1
        }),
    )

    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
    const request = createFetchClient()

    const subscription = request({url: 'https://api.example.com/hang'}).subscribe({
      next: () => undefined,
      error: () => undefined,
    })

    subscription.unsubscribe()

    expect(abortSpy).toHaveBeenCalledTimes(1)
    expect(abortSpy).toHaveBeenCalledWith()
  })
})
