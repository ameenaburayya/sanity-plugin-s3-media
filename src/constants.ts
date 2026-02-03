import {S3AssetType} from './types'
import type {Order} from './types/browser'

export const UPLOAD_STATUS_KEY = '_upload'
export const STALE_UPLOAD_MS = 1000 * 60 * 2

export const SUPPORTED_ASSET_TYPES = [S3AssetType.FILE, S3AssetType.IMAGE]

export const ORDER_OPTIONS: (Order | null)[] = [
  {
    direction: 'desc',
    field: '_createdAt',
  },
  {
    direction: 'asc',
    field: '_createdAt',
  },
  null,
  {
    direction: 'desc',
    field: '_updatedAt',
  },
  {
    direction: 'asc',
    field: '_updatedAt',
  },
  null,
  {
    direction: 'asc',
    field: 'originalFilename',
  },
  {
    direction: 'desc',
    field: 'originalFilename',
  },
  null,
  {
    direction: 'desc',
    field: 'size',
  },
  {
    direction: 'asc',
    field: 'size',
  },
]
