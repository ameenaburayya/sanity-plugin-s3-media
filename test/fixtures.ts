import type {SanityDocument} from 'sanity'
import {
  S3AssetType,
  type S3FileAsset,
  type S3ImageAsset,
  type S3VideoAsset,
} from 'sanity-plugin-s3-media-types'
import type {RootReducerState} from 'src/types'

export const mockDocument: SanityDocument = {
  _rev: 'document-revision-1',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-02T00:00:00.000Z',
  _type: 'post',
  _id: 'doc-1',
}

export const mockS3ImageAsset: S3ImageAsset = {
  ...mockDocument,
  _id: 's3Image-asset-image-1-800x600-jpg',
  _type: 's3ImageAsset',
  extension: 'jpg',
  metadata: {
    _type: 's3ImageMetadata',
    dimensions: {
      _type: 's3ImageDimensions',
      height: 600,
      width: 800,
      aspectRatio: 800 / 600,
    },
  },
  mimeType: 'image/jpeg',
  originalFilename: 'hero.jpg',
  size: 1024,
  source: {
    id: 'source-1',
    name: 's3',
    url: 'https://example.com/source',
  },
  sha1hash: 'hash',
  assetId: 'asset-1',
  title: 'Hero',
}

export const mockS3FileAsset: S3FileAsset = {
  ...mockS3ImageAsset,
  _id: 's3File-asset-file-1-pdf',
  _type: 's3FileAsset',
  extension: 'pdf',
  mimeType: 'application/pdf',
  originalFilename: 'brochure.pdf',
}

export const mockS3VideoAsset: S3VideoAsset = {
  ...mockS3ImageAsset,
  _id: 's3Video-asset-video-1-1920x1080-mp4',
  _type: 's3VideoAsset',
  extension: 'mp4',
  metadata: {
    _type: 's3VideoMetadata',
    dimensions: {
      _type: 's3VideoDimensions',
      height: 1080,
      width: 1920,
      aspectRatio: 1920 / 1080,
    },
  },
  mimeType: 'video/mp4',
  originalFilename: 'promo.mp4',
}



type PreloadedStateOverrides = {
  [K in keyof RootReducerState]?: Partial<RootReducerState[K]>
}

export const createPreloadedState = (
  overrides: PreloadedStateOverrides = {},
): Partial<RootReducerState> => ({
  assets: {
    allIds: [mockS3ImageAsset._id],
    assetTypes: [S3AssetType.IMAGE],
    byIds: {
      [mockS3ImageAsset._id]: {
        _type: 'asset',
        asset: mockS3ImageAsset,
        picked: false,
        updating: false,
      },
    },
    fetchCount: 1,
    fetching: false,
    order: {direction: 'desc', field: '_updatedAt', title: 'Newest'},
    pageIndex: 0,
    pageSize: 100,
    view: 'grid',
    ...(overrides.assets ?? {}),
  } as RootReducerState['assets'],
  dialog: {
    items: [],
    ...(overrides.dialog ?? {}),
  } as RootReducerState['dialog'],
  notifications: {
    items: [],
    ...(overrides.notifications ?? {}),
  } as RootReducerState['notifications'],
  search: {
    query: '',
    ...(overrides.search ?? {}),
  } as RootReducerState['search'],
  selected: {
    assets: [],
    document: mockDocument,
    documentAssetIds: [],
    ...(overrides.selected ?? {}),
  } as RootReducerState['selected'],
  uploads: {
    allIds: [],
    byIds: {},
    ...(overrides.uploads ?? {}),
  } as RootReducerState['uploads'],
})
