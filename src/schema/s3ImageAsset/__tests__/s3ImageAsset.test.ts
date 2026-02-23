import {s3ImageAsset} from '..'

const defineTypeMock = vi.hoisted(() => vi.fn((schema) => schema))
const defineFieldMock = vi.hoisted(() => vi.fn((field) => field))

vi.mock('sanity', () => ({
  defineType: defineTypeMock,
  defineField: defineFieldMock,
}))

describe('s3ImageAsset schema', () => {
  it('defines expected schema fields and ordering', () => {
    const schema = s3ImageAsset as any
    expect(schema.name).toBe('s3ImageAsset')
    expect(schema.type).toBe('document')
    expect(schema.orderings).toEqual([
      {
        title: 'File size',
        name: 'fileSizeDesc',
        by: [{field: 'size', direction: 'desc'}],
      },
    ])

    const fieldNames = schema.fields.map((field: any) => field.name)
    expect(fieldNames).toEqual([
      'originalFilename',
      'label',
      'title',
      'description',
      'altText',
      'sha1hash',
      'extension',
      'mimeType',
      'size',
      'assetId',
      'uploadId',
    ])

    const sha1hashField = schema.fields.find((field: any) => field.name === 'sha1hash') as any
    const required = vi.fn(() => 'required-rule')
    expect((sha1hashField.validation as (rule: any) => unknown)({required})).toBe('required-rule')

    const uploadIdField = schema.fields.find((field: any) => field.name === 'uploadId') as any
    expect(uploadIdField.hidden).toBe(true)
    expect(uploadIdField.readOnly).toBe(true)
  })

  it('formats preview title/subtitle with title fallback behavior', () => {
    const schema = s3ImageAsset as any
    const withPathFallback = schema.preview.prepare({
      path: 'folder/photo.png',
      mimeType: 'image/png',
      size: '2097152',
    })

    expect(withPathFallback).toEqual({
      title: 'photo.png',
      subtitle: 'image/png (2.00 MB)',
    })

    const withNonStringPath = schema.preview.prepare({
      path: {file: 'photo.png'},
      mimeType: 'image/png',
      size: 1024,
    })

    expect(withNonStringPath).toEqual({
      title: false,
      subtitle: 'image/png (0.00 MB)',
    })
  })
})
