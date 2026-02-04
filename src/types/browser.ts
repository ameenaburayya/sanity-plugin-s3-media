import type {Action} from '@reduxjs/toolkit'
import type {SanityClient} from '@sanity/client'
import type {Epic as BaseEpic} from 'redux-observable'

import type {S3Asset, S3AssetType, RootReducerState} from '.'
import type {S3Client} from '../lib'

export type AssetItem = {
  _type: 'asset'
  asset: S3Asset
  error?: string
  picked: boolean
  updating: boolean
}

export type BrowserView = 'grid' | 'table'

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
  confirmCallbackAction: Action
  confirmText: string
  description?: string
  headerTitle: string
  id: string
  title: string
  tone: 'critical' | 'primary'
  type: 'confirm'
}

export type Dialog = DialogAssetEditProps | DialogConfirmProps

export type HttpError = {
  message: string
  statusCode: number
}

export type Epic = BaseEpic<
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
