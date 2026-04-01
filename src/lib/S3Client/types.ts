import type {Observable} from 'rxjs'

import type {UploadEvent} from '../../types'

type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[]

/** @public */
export interface ResponseEvent {
  type: 'response'
  method: string
  statusCode: number
  statusMessage?: string
  headers: Record<string, string>
  body?: JsonValue
  url?: string
}

/** @public */
export type HttpRequestEvent = ResponseEvent | UploadEvent

/** @public */
export interface RequestOptions {
  url?: string
  timeout?: number
  token?: string
  tag?: string
  headers?: Record<string, string>
  method?: string
  query?: Record<string, JsonValue>
  body?: JsonValue
  signal?: AbortSignal
  maxRetries?: number
}

/** @public */
export type Requester = (options: RequestOptions) => Observable<HttpRequestEvent>

/** @internal */
export type Any = JsonValue

/** @public */
export interface S3ClientConfig {
  bucketRegion?: string
  bucketKey?: string
  getSignedUrlEndpoint?: string
  deleteEndpoint?: string
  cloudfrontDomain?: string
  secret?: string
}

/** @public */
export interface InitializedClientConfig extends S3ClientConfig {
  // Required initialization properties
  apiHost: string
  useCdn: boolean

  // HTTP request configuration
  requester?: Requester
  url?: string
  headers?: Record<string, string>
  token?: string

  // Project configuration
  projectId?: string
  useProjectHostname?: boolean

  // Request options
  timeout?: number
  withCredentials?: boolean
  proxy?: string
  fetch?: typeof fetch
}

/** @public */
export type HttpRequest = (
  options: RequestOptions,
  requester?: Requester,
) => Observable<HttpRequestEvent>

/** @public */
export interface ErrorProps {
  message: string
  response: {
    body: JsonValue
    statusCode: number
    headers: Record<string, string>
    statusMessage: string | null
    method: string
    url: string
  }
  statusCode: number
  responseBody: string | JsonValue
  details: JsonValue
}
