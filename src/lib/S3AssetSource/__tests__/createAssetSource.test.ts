import {DocumentsIcon, ImageIcon} from '@sanity/icons'

import {S3AssetSource as S3AssetSourceComponent} from '../../../components'
import {
  createS3FileAssetSource,
  createS3ImageAssetSource,
  createS3VideoAssetSource,
} from '../createAssetSource'

describe('createS3AssetSource', () => {
  it('creates an image asset source with image icon and uploader', () => {
    const props = {title: 'Image source', sanityClient: {}, s3Client: {}} as any

    const source = createS3ImageAssetSource(props)

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('Image source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(ImageIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })

  it('creates a file asset source with documents icon and uploader', () => {
    const props = {title: 'File source', sanityClient: {}, s3Client: {}} as any

    const source = createS3FileAssetSource(props)

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('File source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(DocumentsIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })

  it('creates a video asset source with documents icon and uploader', () => {
    const props = {title: 'Video source', sanityClient: {}, s3Client: {}} as any

    const source = createS3VideoAssetSource(props)

    expect(source.name).toBe('s3-media')
    expect(source.title).toBe('Video source')
    expect(source.component).toBe(S3AssetSourceComponent)
    expect(source.icon).toBe(DocumentsIcon)
    expect(source.Uploader).toBeDefined()
    expect(source.Uploader!.name).toBe('S3AssetSourceUploader')
  })
})
