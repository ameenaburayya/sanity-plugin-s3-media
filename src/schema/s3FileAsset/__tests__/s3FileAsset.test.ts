import {s3FileAsset} from '../s3FileAsset'



describe('s3FileAsset schema', () => {
  type S3FileAssetSchema = typeof s3FileAsset
  type S3FileAssetField = S3FileAssetSchema['fields'][number]

  it('defines expected schema fields and ordering', () => {
    const schema: S3FileAssetSchema = s3FileAsset

    expect(schema.name).toBe('s3FileAsset')
    expect(schema.type).toBe('document')
    expect(schema.orderings).toEqual([
      {
        title: 'File size',
        name: 'fileSizeDesc',
        by: [{field: 'size', direction: 'desc'}],
      },
    ])

    const fieldNames = schema.fields.map((field: S3FileAssetField) => field.name)

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

    const sha1hashField = schema.fields.find(
      (field): field is S3FileAssetField => field.name === 'sha1hash',
    )
    const required = vi.fn(() => 'required-rule')

    expect((sha1hashField?.validation as (rule: {required: () => unknown}) => unknown)({required})).toBe(
      'required-rule',
    )

    const uploadIdField = schema.fields.find((field): field is S3FileAssetField => field.name === 'uploadId')

    expect(uploadIdField!.hidden).toBe(true)
    expect(uploadIdField!.readOnly).toBe(true)
  })

  
})
