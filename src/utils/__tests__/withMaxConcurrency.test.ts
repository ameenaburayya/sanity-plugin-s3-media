import {lastValueFrom, merge, Observable, toArray} from 'rxjs'

import {withMaxConcurrency} from '../withMaxConcurrency'

describe('withMaxConcurrency', () => {
  it('limits concurrent observable subscriptions', async () => {
    let inFlight = 0
    let maxInFlight = 0

    const task$ = (id: number) =>
      new Observable<number>((observer) => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)

        const timeout = setTimeout(() => {
          observer.next(id)
          observer.complete()
        }, 10)

        return () => {
          clearTimeout(timeout)
          inFlight -= 1
        }
      })

    const limitedTask = withMaxConcurrency(task$, 2)
    const results = await lastValueFrom(
      merge(...[1, 2, 3, 4].map((id) => limitedTask(id))).pipe(toArray()),
    )

    expect(maxInFlight).toBeLessThanOrEqual(3)
    expect(results.sort()).toEqual([1, 2, 3, 4])
  })
})
