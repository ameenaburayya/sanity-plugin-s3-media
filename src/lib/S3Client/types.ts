import type {Observable} from 'rxjs'
import type {UploadEvent} from '../../types'

/** @public */
export interface ResponseEvent {
  type: 'response'
  method: string
  statusCode: number
  statusMessage?: string
  headers: Record<string, string>
}

/** @public */
export type HttpRequestEvent = ResponseEvent | UploadEvent

/** @public */
export type Requester = (options: RequestOptions) => Observable<HttpRequestEvent>

/** @public */
export interface RequestOptions {
  url?: string
  timeout?: number
  token?: string
  tag?: string
  headers?: Record<string, string>
  method?: string
  query?: any
  body?: any
  signal?: AbortSignal
  maxRetries?: number
}

/** @internal */
export type Any = any

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
  fetch?: any
}

/** @public */
export type HttpRequest = (
  options: RequestOptions,
  requester?: Requester
) => Observable<HttpRequestEvent>

/** @public */
export interface ErrorProps {
  message: string
  response: any
  statusCode: number
  responseBody: any
  details: any
}
