import {_isType, type FileLike, type SchemaType} from 'sanity'

import type {S3UploaderDefinition} from '../../types'
import {accepts} from '../../utils'
import {uploaders} from './uploaders'

export function resolveUploaderBySchemaType(
  schemaType: SchemaType,
  file: FileLike,
): S3UploaderDefinition | null {
  return (
    uploaders.find((uploader) => {
      return (
        _isType(schemaType, uploader.schemaTypeName) &&
        accepts(file, uploader.accepts) &&
        accepts(file, schemaType.options?.accept || '')
      )
    }) || null
  )
}
