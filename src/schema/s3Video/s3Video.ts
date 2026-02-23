import {defineField, defineType} from 'sanity'

import {S3FileInput} from '../s3File/components'

export const s3Video = defineType({
  name: 's3Video',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      type: 'reference',
      to: {type: 's3VideoAsset'},
      validation: (Rule) => Rule.required(),
    }),
  ],
  components: {
    input: S3FileInput,
    field: (fieldProps) => fieldProps.renderDefault({...fieldProps, level: 0}),
  },
})
