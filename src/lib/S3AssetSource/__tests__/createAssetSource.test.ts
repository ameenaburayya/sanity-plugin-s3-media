import {DocumentsIcon, ImageIcon} from '@sanity/icons'
import type {SanityClient} from 'sanity'

import {S3AssetSource as S3AssetSourceComponent} from '../../../components'
import type {S3Client} from '../../S3Client'
import {
  createS3FileAssetSource,
  createS3ImageAssetSource,
  createS3VideoAssetSource,
} from '../createAssetSource'

const createProps = (title: string) => {
  const sanityClient = {} as SanityClient
  const s3Client = {} as S3Client

  return {title, sanityClient, s3Client}
}

describe('createS3AssetSource', () => {
  it('creates an image asset source with image icon and uploader', () => {
    const source = createS3ImageAssetSource(createProps('Image source'))

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('Image source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(ImageIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })

  it('creates a file asset source with documents icon and uploader', () => {
    const source = createS3FileAssetSource(createProps('File source'))

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('File source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(DocumentsIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })

  it('creates a video asset source with documents icon and uploader', () => {
    const source = createS3VideoAssetSource(createProps('Video source'))

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('Video source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(DocumentsIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })
})
