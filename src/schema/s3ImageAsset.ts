import {defineField, defineType} from 'sanity'

export const s3ImageAsset = defineType({
  name: 's3.imageAsset',
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
    defineField({
      name: 'path',
      type: 'string',
      title: 'Path',
      readOnly: true,
    }),
    defineField({
      name: 'url',
      type: 'string',
      title: 'Url',
      readOnly: true,
    }),
    // defineField({
    //   name: 'metadata',
    //   type: 'sanity.imageMetadata',
    //   title: 'Metadata'
    // }),
    defineField({
      name: 'source',
      type: 's3.assetSourceData',
      title: 'Source',
      readOnly: true,
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
    prepare(doc: Partial<SanityDocument>) {
      return {
        title: doc.title || (typeof doc.path === 'string' && doc.path.split('/').slice(-1)[0]),
        media: {
          asset: {_ref: doc.id},
          ...(doc.media ? {media: doc.media} : {}),
        },
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
