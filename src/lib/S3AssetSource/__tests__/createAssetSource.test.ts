import {createS3FileAssetSource, createS3ImageAssetSource} from '../createAssetSource'

const createS3UploaderMock = vi.hoisted(() => vi.fn(() => 'UploaderToken'))
const {imageIcon, documentsIcon, component} = vi.hoisted(() => ({
  imageIcon: Symbol('ImageIcon'),
  documentsIcon: Symbol('DocumentsIcon'),
  component: Symbol('S3AssetSourceComponent'),
}))

vi.mock('@sanity/icons', () => ({
  ImageIcon: imageIcon,
  DocumentsIcon: documentsIcon,
}))

vi.mock('../../../components', () => ({
  S3AssetSource: component,
}))

vi.mock('../uploader', () => ({
  createS3Uploader: createS3UploaderMock,
}))

describe('createS3AssetSource', () => {
  it('creates an image asset source with image icon and uploader', () => {
    const props = {title: 'Image source', sanityClient: {}, s3Client: {}} as any

    const source = createS3ImageAssetSource(props)

    expect(source).toEqual({
      name: 's3-media',
      title: 'Image source',
      component,
      icon: imageIcon,
      Uploader: 'UploaderToken',
    })
    expect(createS3UploaderMock).toHaveBeenCalledWith(props)
  })

  it('creates a file asset source with documents icon and uploader', () => {
    const props = {title: 'File source', sanityClient: {}, s3Client: {}} as any

    const source = createS3FileAssetSource(props)

    expect(source).toEqual({
      name: 's3-media',
      title: 'File source',
      component,
      icon: documentsIcon,
      Uploader: 'UploaderToken',
    })
    expect(createS3UploaderMock).toHaveBeenCalledWith(props)
  })
})
