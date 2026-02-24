import type {ObjectDefinition, ObjectSchemaType, Reference} from 'sanity'
import type {S3AssetType} from 'sanity-plugin-s3-media-types'

/** @public */
export type S3File = {_type: S3AssetType.FILE; asset: Reference}

/** @public */
export type S3Image = {_type: S3AssetType.IMAGE; asset: Reference}

/** @public */
export type S3Video = {_type: S3AssetType.VIDEO; asset: Reference}

/** @public */
export type S3FileOptions = {storeOriginalFilename?: boolean; accept?: string}

/** @public */
export type S3ImageOptions = {storeOriginalFilename?: boolean; accept?: string}

/** @public */
export type S3VideoOptions = {storeOriginalFilename?: boolean; accept?: string}

/** @public */
export type S3FileSchemaType = Omit<ObjectSchemaType, 'options'> & {options?: S3FileOptions}

/** @public */
export type S3ImageSchemaType = Omit<ObjectSchemaType, 'options'> & {options?: S3ImageOptions}

/** @public */
export type S3VideoSchemaType = Omit<ObjectSchemaType, 'options'> & {options?: S3VideoOptions}

/** @public */
export interface S3FileDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options' | 'groups'
> {
  type: 's3File'
  options?: S3FileOptions
}

/** @public */
export interface S3ImageDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options' | 'groups'
> {
  type: 's3Image'
  options?: S3ImageOptions
}

/** @public */
export interface S3VideoDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options' | 'groups'
> {
  type: 's3Video'
  options?: S3VideoOptions
}
