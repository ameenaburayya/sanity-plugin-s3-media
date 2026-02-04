import {from, type Observable} from 'rxjs'

export const hashFile = (file: File): Observable<string> => {
  return from(
    file.arrayBuffer().then((buffer) => {
      return crypto.subtle.digest('SHA-1', buffer).then((hash) => {
        const hashArray = Array.from(new Uint8Array(hash))
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      })
    }),
  )
}
