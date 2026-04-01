import {getOrderTitle} from '../orders'

describe('getOrderTitle', () => {
  const createdAtAscOrder = {field: '_createdAt', direction: 'asc'} as const
  const updatedAtDescOrder = {field: '_updatedAt', direction: 'desc'} as const
  const mimeTypeAscOrder = {field: 'mimeType', direction: 'asc'} as const
  const originalFilenameDescOrder = {field: 'originalFilename', direction: 'desc'} as const
  const sizeDescOrder = {field: 'size', direction: 'desc'} as const
  const unknownFieldOrder = {field: 'unknown', direction: 'asc'} as const

  it('returns human-readable order labels for known fields', () => {
    expect(getOrderTitle(createdAtAscOrder)).toBe(
      'Last created: Oldest first',
    )
    expect(getOrderTitle(updatedAtDescOrder)).toBe(
      'Last updated: Newest first',
    )
    expect(getOrderTitle(mimeTypeAscOrder)).toBe('MIME type: A to Z')
    expect(getOrderTitle(originalFilenameDescOrder)).toBe(
      'File name: Z to A',
    )
    expect(getOrderTitle(sizeDescOrder)).toBe(
      'File size: Largest first',
    )
  })

  it('throws when an unknown order field is provided', () => {
    expect(() => getOrderTitle(unknownFieldOrder)).toThrow()
  })
})
