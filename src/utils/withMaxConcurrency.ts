// Takes a observable-returning function and returns a new function that limits on the number of
// concurrent observables.
import {Observable, Subject, Subscription} from 'rxjs'
import {first, mergeMap} from 'rxjs/operators'

const DEFAULT_CONCURRENCY = 4

function remove<T>(array: Array<T>, item: T): Array<T> {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
  return array
}

const createThrottler = <T>(concurrency: number = DEFAULT_CONCURRENCY) => {
  const currentSubscriptions: Array<Subscription> = []
  const pendingObservables: Array<Observable<T>> = []
  const ready$ = new Subject<Observable<T>>()

  function request(observable: Observable<T>): Observable<T> {
    return new Observable((observer) => {
      if (currentSubscriptions.length >= concurrency) {
        return scheduleAndWait$(observable).subscribe(observer)
      }
      const subscription = observable.subscribe(observer)
      currentSubscriptions.push(subscription)
      return () => {
        remove(currentSubscriptions, subscription)
        remove(pendingObservables, observable)
        subscription.unsubscribe()
        while (pendingObservables.length > 0 && currentSubscriptions.length < concurrency) {
          // We check length > 0, so shift() will not return undefined here
          ready$.next(pendingObservables.shift()!)
        }
      }
    })
  }

  function scheduleAndWait$(observable: Observable<T>): Observable<T> {
    pendingObservables.push(observable)
    return ready$.asObservable().pipe(
      first((obs) => obs === observable),
      mergeMap((obs) => obs), // Unwrap Observable<Observable<T>> to Observable<T>
    )
  }

  return request
}

export const withMaxConcurrency = <A extends any[], R>(
  func: (...args: A) => Observable<R>,
  concurrency: number = DEFAULT_CONCURRENCY,
): ((...args: A) => Observable<R>) => {
  const throttler = createThrottler<R>(concurrency)
  return (...args: A) => throttler(func(...args))
}
