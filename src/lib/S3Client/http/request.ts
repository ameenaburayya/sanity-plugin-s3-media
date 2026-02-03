import {tap} from 'rxjs/operators'

import type {RequestOptions, Requester} from '../types'
import {createFetchClient} from './fetchClient'

type HttpRequestConfig = {
  ignoreWarnings?: string | RegExp | Array<string | RegExp>
}

/** @internal */
export function defineHttpRequest(config: HttpRequestConfig = {}): Requester {
  const fetchClient = createFetchClient()
  const seen: Record<string, boolean> = {}

  return (options: RequestOptions) => {
    return fetchClient({
      ...options,
      timeout: options.timeout || 5 * 60 * 1000,
      maxRetries: options.maxRetries === undefined ? 3 : options.maxRetries,
      retryDelay: 1000,
    }).pipe(
      tap((event) => {
        if (event.type === 'response') {
          const warn = event.headers['x-sanity-warning']
          if (!warn) return

          const warnings = Array.isArray(warn) ? warn : [warn]
          warnings.forEach((msg) => {
            if (!msg || seen[msg]) return

            // Skip warnings that match ignore patterns
            if (shouldIgnoreWarning(msg, config)) return

            seen[msg] = true
            console.warn(msg) // eslint-disable-line no-console
          })
        }
      })
    )
  }
}

function shouldIgnoreWarning(message: string, config: HttpRequestConfig): boolean {
  if (!config.ignoreWarnings) return false

  const patterns = Array.isArray(config.ignoreWarnings)
    ? config.ignoreWarnings
    : [config.ignoreWarnings]

  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return message.includes(pattern)
    } else if (pattern instanceof RegExp) {
      return pattern.test(message)
    }
    return false
  })
}
