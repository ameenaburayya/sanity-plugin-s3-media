import {UnresolvableError} from '../errors'
import {getForgivingResolver, isObject} from '../utils'

describe('utils', () => {
  it('detects plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({a: 1})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('str')).toBe(false)
    expect(isObject(42)).toBe(false)
  })

  it('creates forgiving resolvers for unresolvable errors only', () => {
    const forgivingUnresolvable = getForgivingResolver((value: string) => {
      if (value === 'bad') {
        throw new UnresolvableError(value)
      }

      return value.length
    })

    expect(forgivingUnresolvable('good')).toBe(4)
    expect(forgivingUnresolvable('bad')).toBeUndefined()

    const forgivingNonUnresolvable = getForgivingResolver((value: string) => {
      if (value === 'boom') {
        throw new Error('boom')
      }

      return value.length
    })

    expect(() => forgivingNonUnresolvable('boom')).toThrow('boom')
  })
})
