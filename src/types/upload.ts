import type {Observable} from 'rxjs'
import type {FormPatch, SanityClient, UploadOptions} from 'sanity'
import type {S3Client} from '../lib'
import type {S3AssetDocument, S3AssetType} from './asset'

export type S3Uploader = (options: {
  sanityClient: SanityClient
  s3Client: S3Client
  file: File
  options?: UploadOptions
}) => Observable<{
  type: 'uploadProgress'
  patches: FormPatch[] | null
}>

export type S3UploaderDefinition = {
  assetType: S3AssetType
  schemaTypeName: 's3Image' | 's3File'
  accepts: string
  upload: S3Uploader
}

export type UploadProgressEvent = {
  type: 'progress'
  stage: 'upload' | 'download'
  percent: number
  total?: number
  loaded?: number
  lengthComputable: boolean
}

export type UploadCompleteEvent = {
  type: 'complete'
  exists?: boolean
  id: string
  asset: S3AssetDocument
}

export type UploadEvent = UploadProgressEvent | UploadCompleteEvent
