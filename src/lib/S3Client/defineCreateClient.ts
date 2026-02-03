import {defineHttpRequest} from './http/request'
import type {HttpRequest, S3ClientConfig} from './types'

/**
 * Create the `requester` and `createClient` exports
 * @internal
 */
export default function defineCreateClientExports<
  S3ClientType,
  ClientConfigType extends S3ClientConfig
>(ClassConstructor: new (httpRequest: HttpRequest, config: ClientConfigType) => S3ClientType) {
  const createClient = (config: ClientConfigType) => {
    const clientRequester = defineHttpRequest()

    return new ClassConstructor(
      (options, requester) => (requester || clientRequester)(options),
      config
    )
  }

  return {createClient}
}
