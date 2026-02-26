import {UnresolvableError, isUnresolvableError} from '../errors'

describe('errors', () => {
  it('creates unresolvable errors with input payload', () => {
    const error = new UnresolvableError({value: 'bad'}, 'Custom failure')

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Custom failure')
    expect(error.input).toEqual({value: 'bad'})
    expect(error.unresolvable).toBe(true)
  })

  it('detects unresolvable errors', () => {
    expect(isUnresolvableError(new UnresolvableError('bad'))).toBe(true)
    expect(isUnresolvableError(new Error('nope'))).toBe(false)
    expect(isUnresolvableError({unresolvable: true})).toBe(false)
  })
})
