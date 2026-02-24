import {S3AssetType} from 'sanity-plugin-s3-media-types'

import type {S3UploaderDefinition} from '../../types'
import {uploadFile} from './uploadFile'
import {uploadImage} from './uploadImage'
import {uploadVideo} from './uploadVideo'

const UPLOAD_IMAGE: S3UploaderDefinition = {
  schemaTypeName: S3AssetType.IMAGE,
  assetType: S3AssetType.IMAGE,
  accept: 'image/*',
  upload: uploadImage,
}

const UPLOAD_FILE: S3UploaderDefinition = {
  schemaTypeName: S3AssetType.FILE,
  assetType: S3AssetType.FILE,
  accept: '',
  upload: uploadFile,
}

const UPLOAD_VIDEO: S3UploaderDefinition = {
  schemaTypeName: S3AssetType.VIDEO,
  assetType: S3AssetType.VIDEO,
  accept: 'video/*',
  upload: uploadVideo,
}

export const uploaders: Array<S3UploaderDefinition> = [UPLOAD_IMAGE, UPLOAD_FILE, UPLOAD_VIDEO]
