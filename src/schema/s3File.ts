import {defineField, defineType} from 'sanity'

import {S3FileInput} from '../components'

export const s3File = defineType({
  name: 's3File',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      type: 'reference',
      to: [{type: 's3.fileAsset'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
  components: {
    input: S3FileInput,
  },
})
