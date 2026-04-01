import {s3ImageAsset} from '../s3ImageAsset'

type S3ImageAssetSchema = typeof s3ImageAsset
type SchemaField = S3ImageAssetSchema['fields'][number]


describe('s3ImageAsset schema', () => {
  it('defines expected schema fields and ordering', () => {
    const schema: S3ImageAssetSchema = s3ImageAsset

    expect(schema.name).toBe('s3ImageAsset')
    expect(schema.type).toBe('document')
    expect(schema.orderings).toEqual([
      {
        title: 'File size',
        name: 'fileSizeDesc',
        by: [{field: 'size', direction: 'desc'}],
      },
    ])

    const fieldNames = schema.fields.map((field: SchemaField) => field.name)

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

    const sha1hashField = schema.fields.find((field: SchemaField) => field.name === 'sha1hash')
    const required = vi.fn(() => 'required-rule')

    expect(
      (sha1hashField?.validation as (rule: {required: () => unknown}) => unknown)({required}),
    ).toBe('required-rule')

    const uploadIdField = schema.fields.find((field: SchemaField) => field.name === 'uploadId')

    expect(uploadIdField?.hidden).toBe(true)
    expect(uploadIdField?.readOnly).toBe(true)
  })
})
