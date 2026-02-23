import {ClientError, ServerError} from '../errors'

const createResponse = (overrides: Record<string, unknown> = {}) => {
  return {
    method: 'GET',
    url: 'https://api.example.com/items',
    statusCode: 400,
    statusMessage: null,
    headers: {'content-type': 'application/json'},
    body: {},
    ...overrides,
  }
}

describe('ClientError', () => {
  it('builds API/Boom style messages and stringifies json response bodies', () => {
    const response = createResponse({
      body: {
        error: 'Bad Request',
        message: 'Validation failed',
      },
    })

    const error = new ClientError(response)

    expect(error.message).toBe('Bad Request - Validation failed')
    expect(error.statusCode).toBe(400)
    expect(error.response).toBe(response)
    expect(error.responseBody).toBe(JSON.stringify(response.body, null, 2))
    expect(error.details).toBeUndefined()
  })

  it('uses the error string directly when no message field exists', () => {
    const response = createResponse({
      body: {
        error: 'Permission denied',
      },
    })

    const error = new ClientError(response)

    expect(error.message).toBe('Permission denied')
  })

  it('uses body.message when error is null', () => {
    const response = createResponse({
      body: {
        error: null,
        message: 'Forbidden',
      },
      statusCode: 403,
    })

    const error = new ClientError(response)

    expect(error.message).toBe('Forbidden')
    expect(error.statusCode).toBe(403)
  })

  it('falls back to generic http message when error is non-string and message is missing', () => {
    const response = createResponse({
      method: 'PATCH',
      statusCode: 422,
      body: {
        error: 1234,
      },
    })

    const error = new ClientError(response)

    expect(error.message).toBe('PATCH-request to https://api.example.com/items resulted in HTTP 422')
  })
})

describe('ServerError', () => {
  it('uses nested error.description and captures details', () => {
    const response = createResponse({
      statusCode: 500,
      body: {
        error: {
          description: 'Query failed in dataset',
          code: 'ERR_QUERY',
        },
      },
    })

    const error = new ServerError(response)

    expect(error.message).toBe('Query failed in dataset')
    expect(error.statusCode).toBe(500)
    expect(error.details).toEqual({
      description: 'Query failed in dataset',
      code: 'ERR_QUERY',
    })
  })

  it('falls back to http-formatted messages for string bodies and truncates details', () => {
    const longBody = 'x'.repeat(120)
    const response = createResponse({
      method: 'POST',
      url: 'https://api.example.com/upload',
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      headers: {'content-type': 'text/plain'},
      body: longBody,
    })

    const error = new ServerError(response)

    expect(error.responseBody).toBe(longBody)
    expect(error.message).toContain('POST-request to https://api.example.com/upload resulted in HTTP 502')
    expect(error.message).toContain('Bad Gateway')
    expect(error.message).toContain('…')
  })

  it('falls back to generic http message for unknown error objects', () => {
    const response = createResponse({
      method: 'DELETE',
      statusCode: 418,
      body: {
        error: {
          reason: 'teapot',
        },
      },
      headers: {'content-type': 'text/plain'},
    })

    const error = new ServerError(response)

    expect(error.responseBody).toEqual(response.body)
    expect(error.message).toBe(
      'DELETE-request to https://api.example.com/items resulted in HTTP 418',
    )
  })

  it('keeps short string bodies without ellipsis in generic http messages', () => {
    const response = createResponse({
      method: 'GET',
      statusCode: 503,
      statusMessage: null,
      headers: {'content-type': 'text/plain'},
      body: 'temporary outage',
    })

    const error = new ServerError(response)

    expect(error.message).toBe(
      'GET-request to https://api.example.com/items resulted in HTTP 503 (temporary outage)',
    )
  })
})
