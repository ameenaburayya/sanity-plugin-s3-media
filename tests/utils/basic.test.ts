import {describe, expect, it} from 'vitest'

import {accepts} from '../../src/utils/accepts'
import {formatBytes} from '../../src/utils/formatBytes'
import {imageUrlToBlob} from '../../src/utils/imageUrlToBlob'
import {isObject} from '../../src/utils/isObject'

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('formats using binary units', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('clamps negative decimals to zero', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB')
  })
})

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true)
  })

  it('returns false for null, arrays, and primitives', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('nope')).toBe(false)
  })
})

describe('accepts', () => {
  it('fails open when file or accepted types are missing', () => {
    expect(accepts(undefined as any, 'image/png')).toBe(true)
    expect(accepts({name: 'file.txt', type: 'text/plain'} as any, undefined as any)).toBe(true)
  })

  it('accepts file extensions', () => {
    const file = {name: 'photo.JPG', type: 'image/jpeg'} as any
    expect(accepts(file, '.jpg,.png')).toBe(true)
  })

  it('accepts wildcard mime types', () => {
    const file = {name: 'photo.png', type: 'image/png'} as any
    expect(accepts(file, 'image/*')).toBe(true)
  })

  it('rejects unsupported types', () => {
    const file = {name: 'doc.pdf', type: 'application/pdf'} as any
    expect(accepts(file, 'image/*')).toBe(false)
  })
})

describe('imageUrlToBlob', () => {
  it('rejects webkit fake urls', async () => {
    await expect(imageUrlToBlob('webkit-fake-url://example')).rejects.toThrow(
      'Cannot read image contents from webkit fake url',
    )
  })
})
