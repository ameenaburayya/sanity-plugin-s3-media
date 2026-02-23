import {lastValueFrom, type Observable,of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {S3AssetType} from '../../../types'
import {uploadS3Asset} from '../assets'

const hashFileMock = vi.hoisted(() => vi.fn())

vi.mock('../../../utils', () => ({
  hashFile: hashFileMock,
  withMaxConcurrency: <A extends unknown[], R>(func: (...args: A) => R) => func,
}))

const collectEvents = async <T>(stream$: Observable<T>): Promise<T[]> => {
  return lastValueFrom(stream$.pipe(toArray()))
}

describe('uploadS3Asset', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an existing file asset when duplicate is found', async () => {
    hashFileMock.mockReturnValue(of('existinghash'))

    const existingAsset = {
      _id: 's3File-existinghash-pdf',
      _type: 's3FileAsset',
      assetId: 'existinghash',
      extension: 'pdf',
      mimeType: 'application/pdf',
      sha1hash: 'existinghash',
      size: 3,
    }

    const fetch = vi.fn(() => of(existingAsset))
    const create = vi.fn(() => of(null))
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const events = await collectEvents(
      uploadS3Asset({
        file: new File(['pdf'], 'manual.pdf', {type: 'application/pdf'}),
        assetType: S3AssetType.FILE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $documentType && _id == $id][0]',
      {documentType: 's3FileAsset', id: 's3File-existinghash-pdf'},
      {tag: 's3Asset.find-duplicate'},
    )
    expect(uploadAsset).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
    expect(events).toEqual([
      {
        type: 'complete',
        id: 's3File-existinghash-pdf',
        asset: existingAsset,
        exists: true,
      },
    ])
  })

  it('uploads and creates a new file asset when duplicate is not found', async () => {
    hashFileMock.mockReturnValue(of('newhash'))

    const fetch = vi.fn(() => of(null))
    const createdAsset = {
      _id: 's3File-newhash-pdf',
      _type: 's3FileAsset',
      assetId: 'newhash',
      extension: 'pdf',
      mimeType: 'application/pdf',
      sha1hash: 'newhash',
      size: 3,
    }
    const create = vi.fn(() => of(createdAsset))

    const uploadProgressEvent = {
      type: 'progress',
      stage: 'upload',
      percent: 25,
      lengthComputable: true,
    }

    const uploadAsset = vi.fn(() => of(uploadProgressEvent, {type: 'response'}))

    const file = new File(['pdf'], 'manual.pdf', {type: 'application/pdf'})

    const events = await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.FILE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.FILE,
      file,
      fileName: 'newhash.pdf',
    })

    expect(create).toHaveBeenCalledWith({
      _id: 's3File-newhash-pdf',
      _type: 's3FileAsset',
      assetId: 'newhash',
      originalFilename: 'manual.pdf',
      sha1hash: 'newhash',
      extension: 'pdf',
      mimeType: 'application/pdf',
      size: 3,
    })

    expect(events).toEqual([
      uploadProgressEvent,
      {
        type: 'complete',
        id: createdAsset._id,
        asset: createdAsset,
      },
    ])
  })

  it('builds image metadata and omits original filename when disabled', async () => {
    hashFileMock.mockReturnValue(of('imagehash'))

    const createObjectURL = vi.fn(() => 'blob://image-preview')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class ImageMock {
      width = 320
      height = 200
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onload?.()
      }
    }

    vi.stubGlobal('Image', ImageMock as any)

    const fetch = vi.fn(() => of(null))
    const createdAsset = {
      _id: 's3Image-imagehash-320x200-png',
      _type: 's3ImageAsset',
      assetId: 'imagehash',
      extension: 'png',
      mimeType: 'image/png',
      sha1hash: 'imagehash',
      size: 5,
      metadata: {
        _type: 's3ImageMetadata',
        dimensions: {
          _type: 's3ImageDimensions',
          width: 320,
          height: 200,
          aspectRatio: 1.6,
        },
      },
    }
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const file = new File(['image'], 'photo.png', {type: 'image/png'})

    const events = await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.IMAGE,
        options: {storeOriginalFilename: false},
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: 'imagehash-320x200.png',
    })

    expect(create).toHaveBeenCalledWith({
      _id: 's3Image-imagehash-320x200-png',
      _type: 's3ImageAsset',
      assetId: 'imagehash',
      originalFilename: undefined,
      sha1hash: 'imagehash',
      extension: 'png',
      mimeType: 'image/png',
      size: 5,
      metadata: {
        _type: 's3ImageMetadata',
        dimensions: {
          _type: 's3ImageDimensions',
          width: 320,
          height: 200,
          aspectRatio: 1.6,
        },
      },
    })

    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob://image-preview')

    expect(events).toEqual([
      {
        type: 'complete',
        id: createdAsset._id,
        asset: createdAsset,
      },
    ])
  })

  it('continues image upload when image dimensions cannot be read', async () => {
    hashFileMock.mockReturnValue(of('hashwithoutdimensions'))

    const createObjectURL = vi.fn(() => 'blob://broken-preview')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class BrokenImageMock {
      width = 0
      height = 0
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onerror?.()
      }
    }

    vi.stubGlobal('Image', BrokenImageMock as any)

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: 's3File-hashwithoutdimensions-png',
        _type: 's3ImageAsset',
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const file = new File(['image'], 'photo.png', {type: 'image/png'})

    await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.IMAGE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $documentType && _id == $id][0]',
      {documentType: 's3ImageAsset', id: 's3File-hashwithoutdimensions-png'},
      {tag: 's3Asset.find-duplicate'},
    )

    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: 'hashwithoutdimensions.png',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 's3File-hashwithoutdimensions-png',
        _type: 's3ImageAsset',
      }),
    )

    expect(revokeObjectURL).toHaveBeenCalledWith('blob://broken-preview')
  })

  it('skips image dimension probing for non-image mime types', async () => {
    hashFileMock.mockReturnValue(of('textassethash'))

    const createObjectURL = vi.fn()
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: 's3File-textassethash-txt',
        _type: 's3ImageAsset',
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const file = new File(['text'], 'notes.txt', {type: 'text/plain'})

    await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.IMAGE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(createObjectURL).not.toHaveBeenCalled()
    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: 'textassethash.txt',
    })
  })

  it('uploads without duplicate lookup when hash generation returns an empty value', async () => {
    hashFileMock.mockReturnValue(of(''))

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: '',
        _type: 's3FileAsset',
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const file = new File(['text'], 'notes.txt', {type: 'text/plain'})

    const events = await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.FILE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.FILE,
      file,
      fileName: '.txt',
    })
    expect(create).toHaveBeenCalledWith({
      _id: '',
      _type: 's3FileAsset',
      assetId: '',
      originalFilename: 'notes.txt',
      sha1hash: undefined,
      extension: 'txt',
      mimeType: 'text/plain',
      size: 4,
    })
    expect(events).toEqual([
      {
        type: 'complete',
        id: '',
        asset: {_id: '', _type: 's3FileAsset'},
      },
    ])
  })
})
