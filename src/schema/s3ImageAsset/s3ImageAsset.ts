import {defineField, defineType} from 'sanity'

export const s3ImageAsset = defineType({
  name: 's3ImageAsset',
  title: 'Image',
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
      readOnly: true,
      title: 'File extension',
    }),
    defineField({
      name: 'mimeType',
      type: 'string',
      readOnly: true,
      title: 'Mime type',
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
      id: '_id',
      title: 'originalFilename',
      mimeType: 'mimeType',
      size: 'size',
      media: 'media',
    },
    prepare(doc) {
      return {
        title: doc.title,
        subtitle: `${doc.mimeType} (${(Number(doc.size) / 1024 / 1024).toFixed(2)} MB)`,
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
