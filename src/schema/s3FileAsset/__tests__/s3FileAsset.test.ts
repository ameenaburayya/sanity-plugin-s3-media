import {s3FileAsset} from '..'

const defineTypeMock = vi.hoisted(() => vi.fn((schema) => schema))
const defineFieldMock = vi.hoisted(() => vi.fn((field) => field))

vi.mock('sanity', () => ({
  defineType: defineTypeMock,
  defineField: defineFieldMock,
}))

describe('s3FileAsset schema', () => {
  it('defines expected schema fields and ordering', () => {
    const schema = s3FileAsset as any
    expect(schema.name).toBe('s3FileAsset')
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

  it('formats preview title and subtitle', () => {
    const schema = s3FileAsset as any
    const withCustomTitle = schema.preview.prepare({
      title: 'Custom title',
      path: 'folder/fallback.pdf',
      mimeType: 'application/pdf',
      size: 5 * 1024 * 1024,
    })

    expect(withCustomTitle).toEqual({
      title: 'Custom title',
      subtitle: 'application/pdf (5.00 MB)',
    })

    const withPathFallback = schema.preview.prepare({
      path: 'folder/fallback.pdf',
      mimeType: 'application/pdf',
      size: 1 * 1024 * 1024,
    })

    expect(withPathFallback).toEqual({
      title: 'fallback.pdf',
      subtitle: 'application/pdf (1.00 MB)',
    })
  })
})
