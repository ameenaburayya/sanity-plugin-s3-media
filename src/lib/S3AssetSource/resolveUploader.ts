import {type SchemaType, type FileLike, _isType} from 'sanity'
import {accepts} from '../../utils'

import {uploaders} from './uploaders'
import type {S3UploaderDefinition} from '../../types'

export function resolveUploaderBySchemaType(
  schemaType: SchemaType,
  file: FileLike
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
