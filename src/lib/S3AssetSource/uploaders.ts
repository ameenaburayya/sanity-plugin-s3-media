import {uploadFile} from './uploadFile'
import {uploadImage} from './uploadImage'
import {S3AssetType, type S3UploaderDefinition} from '../../types'

const UPLOAD_IMAGE: S3UploaderDefinition = {
  schemaTypeName: 's3Image',
  assetType: S3AssetType.IMAGE,
  accepts: 'image/*',
  upload: uploadImage,
}

const UPLOAD_FILE: S3UploaderDefinition = {
  schemaTypeName: 's3File',
  assetType: S3AssetType.FILE,
  accepts: '',
  upload: uploadFile,
}

export const uploaders: Array<S3UploaderDefinition> = [UPLOAD_IMAGE, UPLOAD_FILE]
