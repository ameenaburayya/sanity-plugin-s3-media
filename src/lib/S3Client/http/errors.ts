import {isObject} from '../../../utils/isObject'
import type {ErrorProps, JsonValue, ResponseEvent} from '../types'

type ErrorDetails = { [key: string]: JsonValue }

/**
 * Shared properties for HTTP errors (eg both ClientError and ServerError)
 * Use `isHttpError` for type narrowing and accessing response properties.
 *
 * @public
 */
export interface HttpError {
  statusCode: number
  message: string
  response: {
    body: JsonValue
    url: string
    method: string
    headers: Record<string, string>
    statusCode: number
    statusMessage: string | null
  }
}

/** @public */
export class ClientError extends Error {
  response: ErrorProps['response'] = {
    body: '',
    statusCode: 0,
    headers: {},
    statusMessage: null,
    method: '',
    url: '',
  }
  statusCode: ErrorProps['statusCode'] = 400
  responseBody: ErrorProps['responseBody'] = ''
  details: ErrorProps['details'] = null

  constructor(res: ResponseEvent) {
    const props = extractErrorProps(res)

    super(props.message)
    Object.assign(this, props)
  }
}

/** @public */
export class ServerError extends Error {
  response: ErrorProps['response'] = {
    body: '',
    statusCode: 0,
    headers: {},
    statusMessage: null,
    method: '',
    url: '',
  }
  statusCode: ErrorProps['statusCode'] = 500
  responseBody: ErrorProps['responseBody'] = ''
  details: ErrorProps['details'] = null

  constructor(res: ResponseEvent) {
    const props = extractErrorProps(res)

    super(props.message)
    Object.assign(this, props)
  }
}

function extractErrorProps(res: ResponseEvent): ErrorProps {
  const response = res as ErrorProps['response']
  const body = response.body ?? ''

  response.body = body
  response.statusMessage = response.statusMessage ?? null
  response.url = response.url || ''

  const props: ErrorProps = {
    response,
    statusCode: res.statusCode,
    responseBody: stringifyBody(body, res),
    message: '',
    details: null,
  }

  // Fall back early if we didn't get a JSON object returned as expected
  if (!isObject(body)) {
    props.message = httpErrorMessage(response, body)
    return props
  }

  const bodyObj = body as ErrorDetails
  const error = bodyObj.error

  // API/Boom style errors ({statusCode, error, message})
  if (typeof error === 'string' && typeof bodyObj.message === 'string') {
    props.message = `${error} - ${bodyObj.message}`
    return props
  }

  // Content Lake errors with a `error` prop being an object
  if (typeof error !== 'object' || error === null) {
    if (typeof error === 'string') {
      props.message = error
    } else if (typeof bodyObj.message === 'string') {
      props.message = bodyObj.message
    } else {
      props.message = httpErrorMessage(response, body)
    }
    return props
  }

  const errorObject = isObject(error) ? (error as ErrorDetails) : undefined

  if (errorObject && typeof errorObject.description === 'string') {
    // Query/database errors ({error: {description, other, arb, props}})
    props.message = String(errorObject.description)
    props.details = errorObject
    return props
  }

  // Other, more arbitrary errors
  props.message = httpErrorMessage(response, body)
  return props
}

function httpErrorMessage(
  res: {
    method: string
    url: string
    statusCode: number
    statusMessage?: string | null
  },
  body: JsonValue,
) {
  const details = typeof body === 'string' ? ` (${sliceWithEllipsis(body, 100)})` : ''
  const statusMessage = res.statusMessage ? ` ${res.statusMessage}` : ''

  return `${res.method}-request to ${res.url} resulted in HTTP ${res.statusCode}${statusMessage}${details}`
}

function stringifyBody(
  body: JsonValue,
  res: {
    headers: Record<string, string>
  },
): string | JsonValue {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1

  return isJson ? JSON.stringify(body, null, 2) : body
}

function sliceWithEllipsis(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max)}…` : str
}
