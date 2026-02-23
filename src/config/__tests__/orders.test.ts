import {getOrderTitle} from '../orders'

describe('getOrderTitle', () => {
  it('returns human-readable order labels for known fields', () => {
    expect(getOrderTitle({field: '_createdAt', direction: 'asc'} as any)).toBe(
      'Last created: Oldest first',
    )
    expect(getOrderTitle({field: '_updatedAt', direction: 'desc'} as any)).toBe(
      'Last updated: Newest first',
    )
    expect(getOrderTitle({field: 'mimeType', direction: 'asc'} as any)).toBe('MIME type: A to Z')
    expect(getOrderTitle({field: 'originalFilename', direction: 'desc'} as any)).toBe(
      'File name: Z to A',
    )
    expect(getOrderTitle({field: 'size', direction: 'desc'} as any)).toBe(
      'File size: Largest first',
    )
  })

  it('throws when an unknown order field is provided', () => {
    expect(() => getOrderTitle({field: 'unknown', direction: 'asc'} as any)).toThrow()
  })
})
