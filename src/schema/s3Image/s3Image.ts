import {defineField, defineType} from 'sanity'

import {S3ImageInput} from './components'

export const s3Image = defineType({
  name: 's3Image',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      type: 'reference',
      to: {type: 's3ImageAsset'},
      validation: (Rule) => Rule.required(),
    }),
  ],
  components: {
    input: S3ImageInput,
    field: (fieldProps) => fieldProps.renderDefault({...fieldProps, level: 0}),
  },
})
