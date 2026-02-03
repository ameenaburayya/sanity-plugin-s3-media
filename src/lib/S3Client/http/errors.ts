import type {Any, ErrorProps} from '../types'
import {isObject} from '../../../utils/isObject'

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
    body: unknown
    url: string
    method: string
    headers: Record<string, string>
    statusCode: number
    statusMessage: string | null
  }
}

/** @public */
export class ClientError extends Error {
  response: ErrorProps['response']
  statusCode: ErrorProps['statusCode'] = 400
  responseBody: ErrorProps['responseBody']
  details: ErrorProps['details']

  constructor(res: Any) {
    const props = extractErrorProps(res)
    super(props.message)
    Object.assign(this, props)
  }
}

/** @public */
export class ServerError extends Error {
  response: ErrorProps['response']
  statusCode: ErrorProps['statusCode'] = 500
  responseBody: ErrorProps['responseBody']
  details: ErrorProps['details']

  constructor(res: Any) {
    const props = extractErrorProps(res)
    super(props.message)
    Object.assign(this, props)
  }
}

function extractErrorProps(res: Any): ErrorProps {
  const body = res.body
  const props = {
    response: res,
    statusCode: res.statusCode,
    responseBody: stringifyBody(body, res),
    message: '',
    details: undefined as Any,
  }

  // Fall back early if we didn't get a JSON object returned as expected
  if (!isObject(body)) {
    props.message = httpErrorMessage(res, body)
    return props
  }

  // Cast to any for property access after isObject check
  const bodyObj = body as any
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
      props.message = httpErrorMessage(res, body)
    }
    return props
  }

  if ('description' in error && typeof error.description === 'string') {
    // Query/database errors ({error: {description, other, arb, props}})
    props.message = error.description
    props.details = error
    return props
  }

  // Other, more arbitrary errors
  props.message = httpErrorMessage(res, body)
  return props
}

function httpErrorMessage(res: Any, body: unknown) {
  const details = typeof body === 'string' ? ` (${sliceWithEllipsis(body, 100)})` : ''
  const statusMessage = res.statusMessage ? ` ${res.statusMessage}` : ''
  return `${res.method}-request to ${res.url} resulted in HTTP ${res.statusCode}${statusMessage}${details}`
}

function stringifyBody(body: Any, res: Any) {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1
  return isJson ? JSON.stringify(body, null, 2) : body
}

function sliceWithEllipsis(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max)}…` : str
}
