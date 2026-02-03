import {Observable} from 'rxjs'

import type {Any, HttpRequestEvent} from '../types'
import {ClientError, ServerError} from './errors'

interface FetchOptions extends RequestInit {
  url?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  maxRetries?: number
  body?: any
}

export const createFetchClient = () => {
  return (options: FetchOptions): Observable<HttpRequestEvent> => {
    return new Observable((subscriber) => {
      const controller = new AbortController()
      const signal = options.signal || controller.signal

      const execute = async (attemptNumber = 0) => {
        try {
          // Validate required fields
          if (!options.url) {
            throw new Error('URL is required for fetch request')
          }

          // Set timeout
          const timeoutMs = options.timeout || 5 * 60 * 1000
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

          // Prepare fetch options
          const fetchOptions: RequestInit = {
            method: options.method || 'GET',
            headers: {
              ...(options.headers || {}),
            },
            signal,
          }

          // Only add Content-Type for requests with body
          if (options.body) {
            fetchOptions.body = JSON.stringify(options.body)
            ;(fetchOptions.headers as Record<string, string>)['Content-Type'] =
              'application/json'
          }

          // Make fetch request
          const response = await fetch(options.url, fetchOptions)

          clearTimeout(timeoutId)

          // Parse JSON response
          const body = await response.json().catch(() => ({}))

          // Emit response event
          const event: Any = {
            type: 'response',
            method: options.method || 'GET',
            statusCode: response.status,
            statusMessage: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body,
            url: options.url,
          }

          // Handle errors
          if (response.status >= 500) {
            const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3
            const shouldRetry = attemptNumber < maxRetries && [502, 503].includes(response.status)

            if (shouldRetry) {
              const delay = (options.retryDelay || 1000) * Math.pow(2, attemptNumber)
              await new Promise((resolve) => setTimeout(resolve, delay))
              return execute(attemptNumber + 1)
            }

            throw new ServerError(event)
          } else if (response.status >= 400) {
            // Retry rate limiting
            const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3
            if (response.status === 429 && attemptNumber < maxRetries) {
              const delay = (options.retryDelay || 1000) * Math.pow(2, attemptNumber)
              await new Promise((resolve) => setTimeout(resolve, delay))
              return execute(attemptNumber + 1)
            }

            throw new ClientError(event)
          }

          subscriber.next(event)
          subscriber.complete()
        } catch (error) {
          if (error instanceof ClientError || error instanceof ServerError) {
            subscriber.error(error)
          } else {
            subscriber.error(new Error(`HTTP request failed: ${error}`))
          }
        }
      }

      execute()

      // Cleanup function
      return () => controller.abort()
    })
  }
}
