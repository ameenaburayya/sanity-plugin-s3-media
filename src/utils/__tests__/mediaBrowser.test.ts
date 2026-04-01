import type {SanityDocument} from '@sanity/client'
import {hues} from '@sanity/color'
import type {S3ImageAsset} from 'sanity-plugin-s3-media-types'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {
  constructFilter,
  getAssetResolution,
  getDocumentAssetIds,
  getSchemeColor,
  getUniqueDocuments,
  isSupportedAssetType,
} from '../mediaBrowser'

const fileId = 's3File-abcdefghijklmnopqrstuvwx-pdf'
const imageId = 's3Image-abcdefghijklmnopqrstuvwx-100x200-jpg'

describe('media browser helpers', () => {
  it('builds groq filters with optional search', () => {
    const baseFilter = constructFilter({
      assetTypes: [S3AssetType.FILE, S3AssetType.IMAGE, S3AssetType.VIDEO],
    })

    expect(baseFilter).toContain('_type in ["s3FileAsset","s3ImageAsset","s3VideoAsset"]')
    expect(baseFilter).toContain('!(_id in path("drafts.**"))')

    const searchFilter = constructFilter({assetTypes: [S3AssetType.FILE], searchQuery: '  cats '})

    expect(searchFilter).toContain("match '*cats*'")
  })

  it('collects and dedupes document asset ids', () => {
    const doc = {
      _id: 'doc-1',
      _type: 'doc',
      hero: {asset: {_type: 'reference', _ref: imageId}},
      gallery: [
        {asset: {_type: 'reference', _ref: fileId}},
        {asset: {_type: 'reference', _ref: imageId}},
      ],
    } as unknown as SanityDocument

    expect(getDocumentAssetIds(doc)).toEqual([fileId, imageId].sort())
  })

  it('prefers drafts over published documents', () => {
    const docs = [{_id: 'drafts.alpha'}, {_id: 'alpha'}, {_id: 'beta'}] as unknown as SanityDocument[]

    expect(getUniqueDocuments(docs).map((doc: SanityDocument) => doc._id)).toEqual([
      'drafts.alpha',
      'beta',
    ])
  })

  it('formats asset resolution strings', () => {
    const asset = {metadata: {dimensions: {width: 120, height: 80}}} as S3ImageAsset

    expect(getAssetResolution(asset)).toBe('120x80px')
  })

  it('returns themed colors by scheme', () => {
    expect(getSchemeColor('dark', 'bg')).toBe(hues.gray[950].hex)
    expect(getSchemeColor('light', 'bg')).toBe(hues.gray[50].hex)
    expect(getSchemeColor('dark', undefined as never)).toBeUndefined()
  })

  it('validates supported asset types', () => {
    expect(isSupportedAssetType('s3File')).toBe(true)
    expect(isSupportedAssetType('s3Image')).toBe(true)
    expect(isSupportedAssetType('s3Video')).toBe(true)
    expect(isSupportedAssetType('nope')).toBe(false)
    expect(isSupportedAssetType()).toBe(false)
  })
})
