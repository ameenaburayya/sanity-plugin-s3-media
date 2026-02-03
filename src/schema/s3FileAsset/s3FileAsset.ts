import {defineField, defineType} from 'sanity'

export const s3FileAsset = defineType({
  name: 's3FileAsset',
  title: 'File',
  type: 'document',
  fields: [
    defineField({
      name: 'originalFilename',
      type: 'string',
      title: 'Original file name',
      readOnly: true,
    }),
    defineField({
      name: 'label',
      type: 'string',
      title: 'Label',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
    defineField({
      name: 'altText',
      type: 'string',
      title: 'Alternative text',
    }),
    defineField({
      name: 'sha1hash',
      type: 'string',
      title: 'SHA1 hash',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'extension',
      type: 'string',
      title: 'File extension',
      readOnly: true,
    }),
    defineField({
      name: 'mimeType',
      type: 'string',
      title: 'Mime type',
      readOnly: true,
    }),
    defineField({
      name: 'size',
      type: 'number',
      title: 'File size in bytes',
      readOnly: true,
    }),
    defineField({
      name: 'assetId',
      type: 'string',
      title: 'Asset ID',
      readOnly: true,
    }),
    defineField({
      name: 'uploadId',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'originalFilename',
      path: 'path',
      mimeType: 'mimeType',
      size: 'size',
    },
    prepare(doc: Record<string, any>) {
      return {
        title: doc.title || doc.path.split('/').slice(-1)[0],
        subtitle: `${doc.mimeType} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`,
      }
    },
  },
  orderings: [
    {
      title: 'File size',
      name: 'fileSizeDesc',
      by: [{field: 'size', direction: 'desc'}],
    },
  ],
})
