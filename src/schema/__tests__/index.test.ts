import * as schemaIndex from '../index'

type NamedField = {name: string}

const getFieldNames = (fields: NamedField[]): string[] => fields.map((field) => field.name)

describe('schema index exports', () => {
  it('exports schema definitions with expected object values', () => {
    expect(schemaIndex.s3File).toMatchObject({
      name: 's3File',
      type: 'object',
      fields: [
        {
          name: 'asset',
          type: 'reference',
          to: {type: 's3FileAsset'},
        },
      ],
    })

    expect(schemaIndex.s3Image).toMatchObject({
      name: 's3Image',
      type: 'object',
      fields: [
        {
          name: 'asset',
          type: 'reference',
          to: {type: 's3ImageAsset'},
        },
      ],
    })

    expect(schemaIndex.s3Video).toMatchObject({
      name: 's3Video',
      type: 'object',
      fields: [
        {
          name: 'asset',
          type: 'reference',
          to: {type: 's3VideoAsset'},
        },
      ],
    })

    expect(schemaIndex.s3FileAsset).toMatchObject({
      name: 's3FileAsset',
      title: 'File',
      type: 'document',
      preview: {
        select: {
          title: 'originalFilename',
          path: 'path',
          mimeType: 'mimeType',
          size: 'size',
        },
        prepare: expect.any(Function),
      },
      orderings: [
        {
          title: 'File size',
          name: 'fileSizeDesc',
          by: [{field: 'size', direction: 'desc'}],
        },
      ],
    })

    expect(getFieldNames(schemaIndex.s3FileAsset.fields as NamedField[])).toEqual([
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

    expect(schemaIndex.s3ImageAsset).toMatchObject({
      name: 's3ImageAsset',
      title: 'Image',
      type: 'document',
      preview: {
        select: {
          id: '_id',
          title: 'originalFilename',
          mimeType: 'mimeType',
          size: 'size',
          media: 'media',
        },
        prepare: expect.any(Function),
      },
      orderings: [
        {
          title: 'File size',
          name: 'fileSizeDesc',
          by: [{field: 'size', direction: 'desc'}],
        },
      ],
    })

    expect(getFieldNames(schemaIndex.s3ImageAsset.fields as NamedField[])).toEqual([
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

    expect(schemaIndex.s3VideoAsset).toMatchObject({
      name: 's3VideoAsset',
      title: 'Video',
      type: 'document',
      preview: {
        select: {
          id: '_id',
          title: 'originalFilename',
          mimeType: 'mimeType',
          size: 'size',
          media: 'media',
        },
        prepare: expect.any(Function),
      },
      orderings: [
        {
          title: 'File size',
          name: 'fileSizeDesc',
          by: [{field: 'size', direction: 'desc'}],
        },
      ],
    })

    expect(getFieldNames(schemaIndex.s3VideoAsset.fields as NamedField[])).toEqual([
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
  })
})
