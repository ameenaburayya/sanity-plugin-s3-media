import type {ObjectDefinition, ObjectSchemaType, Reference} from 'sanity'

import type {S3AssetType, S3FileAsset, S3ImageAsset} from './asset'

/** @public */
export interface S3FileObjectStub {
  _type?: S3AssetType.FILE
  asset: Reference | S3FileAsset
  _upload?: unknown // For in-progress uploads
  [key: string]: unknown
}

/** @public */
export interface S3ImageObjectStub {
  _type?: S3AssetType.IMAGE
  asset: Reference | S3ImageAsset
  [key: string]: unknown
}

/** @public */
export interface S3FileUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3FileAsset
  [key: string]: unknown
}

/** @public */
export interface S3ImageUploadStub {
  _type?: string
  _upload?: unknown
  asset?: S3ImageAsset
  [key: string]: unknown
}

/** @public */
export type S3File = {_type: 's3File'; asset: Reference}

/** @public */
export type S3Image = {_type: 's3Image'; asset: Reference}

/** @public */
export type S3FileOptions = {storeOriginalFilename?: boolean; accept?: string}

/** @public */
export type S3ImageOptions = {storeOriginalFilename?: boolean; accept?: string}

/** @public */
export type S3FileSchemaType = Omit<ObjectSchemaType, 'options'> & {options?: S3FileOptions}

/** @public */
export type S3ImageSchemaType = Omit<ObjectSchemaType, 'options'> & {options?: S3ImageOptions}

/** @public */
export type S3FileSource = Reference | S3FileAsset | S3FileObjectStub | S3FileUploadStub

/** @public */
export type S3ImageSource = Reference | S3ImageAsset | S3ImageObjectStub | S3ImageUploadStub

/** @public */
export type S3AssetObjectStub = S3ImageObjectStub | S3FileObjectStub

/** @public */
export type S3AssetUploadStub = S3ImageUploadStub | S3FileUploadStub

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
export interface S3ImageDimensions {
  _type: 's3ImageDimensions'
  height: number
  width: number
  aspectRatio: number
}

/** @public */
export type S3ImageMetaData = {
  _type: 's3ImageMetadata'
  dimensions: S3ImageDimensions
}

declare module 'sanity' {
  export interface IntrinsicDefinitions {
    s3File: S3FileDefinition
    s3Image: S3ImageDefinition
  }
}
