import type {Action} from '@reduxjs/toolkit'
import type {SanityAssetDocument, SanityClient, SanityImageAssetDocument} from '@sanity/client'
import type {Epic} from 'redux-observable'

import type {S3Asset, S3AssetType, RootReducerState} from '.'
import type {S3Client} from '../lib'

export type MediaToolOptions = {
  maximumUploadSize?: number
}

export type AssetItem = {
  _type: 'asset'
  asset: S3Asset
  error?: string
  picked: boolean
  updating: boolean
}

export type Block = {
  _type: string
  _key: string
  children: Span[]
  markDefs: MarkDef[]
}

export type BrowserView = 'grid' | 'table'

export type ButtonVariant = 'danger' | 'default' | 'secondary'

export type CardAssetData = {
  id: string
  type: 'asset'
}

export type CardUploadData = {
  id: string
  type: 'upload'
}

export type DialogAssetEditProps = {
  assetId?: string
  closeDialogId?: string
  id: string
  type: 'assetEdit'
}

export type DialogConfirmProps = {
  closeDialogId?: string
  confirmCallbackAction: Action // TODO: reconsider
  confirmText: string
  description?: string
  headerTitle: string
  id: string
  title: string
  tone: 'critical' | 'primary'
  type: 'confirm'
}

export type Dialog = DialogAssetEditProps | DialogConfirmProps

export type Document = {
  _createdAt: string
  _id: string
  _rev: string
  _type: string
  _updatedAt: string
  name?: string
  title?: string
}

export type HttpError = {
  message: string
  statusCode: number
}

export type MarkDef = {_key: string; _type: string}

export type Epic = Epic<
  Action,
  Action,
  RootReducerState,
  {
    s3Client: S3Client
    sanityClient: SanityClient
  }
>

type OrderDirection = 'asc' | 'desc'

export type Order = {
  direction: OrderDirection
  field: string
}

export type SanityReference = {
  _ref: string
  _type: 'reference'
  _weak?: boolean
}

export type SanityUploadCompleteEvent = {
  asset: SanityAssetDocument | SanityImageAssetDocument
  id: string
  type: 'complete'
}

export type SanityUploadResponseEvent = {
  body: {document: Partial<SanityAssetDocument | SanityImageAssetDocument>}
  headers: Record<string, string>
  method: string
  statusCode: number
  statusMessage: string
  type: 'response'
  url: string
}

export type Span = {
  _key: string
  text: string
  marks: string[]
}

export type UploadItem = {
  _type: 'upload'
  assetType: S3AssetType
  hash: string
  name: string
  objectUrl?: string
  percent?: number
  size: number
  status: 'complete' | 'queued' | 'uploading'
}
