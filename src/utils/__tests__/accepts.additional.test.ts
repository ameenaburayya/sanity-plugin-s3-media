import {accepts} from '../accepts'

describe('accepts additional branches', () => {
  it('fails open for extension-only accepts when filename is unavailable', () => {
    const fileWithoutName = {type: 'image/png'} as any
    expect(accepts(fileWithoutName, '.png')).toBe(true)
  })

  it('supports array accepts and exact mime checks', () => {
    const file = {name: 'vector.svg', type: 'image/svg+xml'} as any

    expect(accepts(file, ['image/png', 'image/svg+xml'])).toBe(true)
    expect(accepts(file, ['image/png', 'application/pdf'])).toBe(false)
  })

  it('handles files with no mime type by falling back to an empty mime string', () => {
    const fileWithoutMime = {name: 'README', type: undefined} as any

    expect(accepts(fileWithoutMime, 'text/plain')).toBe(false)
    expect(accepts(fileWithoutMime, '.md')).toBe(false)
  })
})
