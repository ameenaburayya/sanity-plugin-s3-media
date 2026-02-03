import type {Middleware, RequestOptions} from 'get-it'

// Browser-safe middleware only
// Note: agent and debug middleware use Node.js streams and are excluded for browser compatibility
const middleware: Middleware[] = [
  // Lineage is used for recursion control/tracing and can be passed either through
  // client constructor or through environment variable.
  {
    processOptions(opts: RequestOptions & {lineage?: string}) {
      const lineage =
        (typeof process !== 'undefined' && process.env.X_SANITY_LINEAGE) || opts.lineage

      if (lineage) {
        opts.headers = opts.headers || {}
        opts.headers['x-sanity-lineage'] = lineage
      }
      return opts
    },
  },
]

export default middleware
