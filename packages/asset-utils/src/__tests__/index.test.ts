import type {S3FileAsset, S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import * as asserters from '../asserters'
import * as errors from '../errors'
import * as parse from '../parse'
import * as paths from '../paths'
import * as resolve from '../resolve'
import * as urls from '../urls'
import * as utils from '../utils'

const assetUtils = {
  ...asserters,
  ...errors,
  ...paths,
  ...parse,
  ...resolve,
  ...urls,
  ...utils,
  S3AssetType,
}

describe('public api', () => {
  const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
  const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x50-png'
  const videoId = 's3Video-abcdefghijklmnopqrstuvwx-1920x1080-mp4'

  const fileAsset: S3FileAsset = {
    _createdAt: '2020-01-01T00:00:00.000Z',
    _updatedAt: '2020-01-01T00:00:00.000Z',
    _rev: 'rev',
    _id: fileId,
    _type: 's3FileAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sha1hash: 'hash',
    size: 12,
  }

  const imageAsset: S3ImageAsset = {
    _createdAt: '2020-01-01T00:00:00.000Z',
    _updatedAt: '2020-01-01T00:00:00.000Z',
    _rev: 'rev',
    _id: imageId,
    _type: 's3ImageAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sha1hash: 'hash',
    size: 12,
    metadata: {
      _type: 's3ImageMetadata',
      dimensions: {
        _type: 's3ImageDimensions',
        height: 50,
        width: 100,
        aspectRatio: 2,
      },
    },
  }

  const videoAsset: S3VideoAsset = {
    _createdAt: '2020-01-01T00:00:00.000Z',
    _updatedAt: '2020-01-01T00:00:00.000Z',
    _rev: 'rev',
    _id: videoId,
    _type: 's3VideoAsset',
    assetId: 'abcdefghijklmnopqrstuvwx',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sha1hash: 'hash',
    size: 12,
    metadata: {
      _type: 's3VideoMetadata',
      dimensions: {
        _type: 's3VideoDimensions',
        height: 1080,
        width: 1920,
        aspectRatio: 16 / 9,
      },
    },
  }

  const unresolvableAsset: S3FileAsset = {
    ...fileAsset,
    _id: 'not-an-asset-id',
  }

  it('exports all utility helpers with real behavior', () => {
    expect(assetUtils.buildS3FileUrl(fileId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx.pdf',
    )
    expect(assetUtils.buildS3ImageUrl(imageId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-100x50.png',
    )
    expect(assetUtils.buildS3VideoUrl(videoId, {baseUrl: 'https://cdn.example.com'})).toBe(
      'https://cdn.example.com/abcdefghijklmnopqrstuvwx-1920x1080.mp4',
    )

    expect(assetUtils.getS3AssetExtension(fileAsset)).toBe('pdf')
    expect(assetUtils.getS3ImageDimensions(imageAsset)).toEqual({
      _type: 's3ImageDimensions',
      width: 100,
      height: 50,
      aspectRatio: 2,
    })
    expect(assetUtils.getS3VideoDimensions(videoAsset)).toEqual({
      _type: 's3VideoDimensions',
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
    })

    expect(assetUtils.tryGetS3AssetExtension(unresolvableAsset)).toBeUndefined()
    expect(assetUtils.tryGetS3ImageDimensions(unresolvableAsset)).toBeUndefined()
    expect(assetUtils.tryGetS3VideoDimensions(unresolvableAsset)).toBeUndefined()
  })

  it('re-exports S3AssetType', () => {
    expect(assetUtils.S3AssetType.FILE).toBe('s3File')
    expect(assetUtils.S3AssetType.IMAGE).toBe('s3Image')
    expect(assetUtils.S3AssetType.VIDEO).toBe('s3Video')
  })

  it('exposes utilities across all top-level modules', () => {
    expect(typeof assetUtils.isS3AssetId).toBe('function')
    expect(typeof assetUtils.parseS3AssetFilename).toBe('function')
    expect(typeof assetUtils.buildS3VideoUrl).toBe('function')
    expect(typeof assetUtils.getS3AssetDocumentId).toBe('function')
    expect(typeof assetUtils.isS3AssetUrl).toBe('function')
    expect(typeof assetUtils.getForgivingResolver).toBe('function')
    expect(typeof assetUtils.UnresolvableError).toBe('function')
  })
})
