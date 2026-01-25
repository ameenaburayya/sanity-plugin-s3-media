import {defineField, defineType} from 'sanity'

export const s3AssetSourceData = defineType({
  name: 's3.assetSourceData',
  title: 'Asset Source Data',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Source name',
      description: 'A canonical name for the source this asset is originating from',
      type: 'string',
    }),
    defineField({
      name: 'id',
      title: 'Asset Source ID',
      description:
        'The unique ID for the asset within the originating source so you can programatically find back to it',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: 'Asset information URL',
      description: 'A URL to find more information about this asset in the originating source',
      type: 'string',
    }),
  ],
})
