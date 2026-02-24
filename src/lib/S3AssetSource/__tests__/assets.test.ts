import {lastValueFrom, type Observable, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {uploadS3Asset} from '../assets'

const collectEvents = async <T>(stream$: Observable<T>): Promise<T[]> => {
  return lastValueFrom(stream$.pipe(toArray()))
}

const getSha1Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hash))

  return hashArray.map((value) => value.toString(16).padStart(2, '0')).join('')
}

describe('uploadS3Asset', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an existing file asset when duplicate is found', async () => {
    const file = new File(['pdf'], 'manual.pdf', {type: 'application/pdf'})
    const hash = await getSha1Hash(file)

    const existingAsset = {
      _id: `s3File-${hash}-pdf`,
      _type: 's3FileAsset',
      assetId: hash,
      extension: 'pdf',
      mimeType: 'application/pdf',
      sha1hash: hash,
      size: 3,
    }

    const fetch = vi.fn(() => of(existingAsset))
    const create = vi.fn(() => of(null))
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const events = await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.FILE,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $documentType && _id == $id][0]',
      {documentType: 's3FileAsset', id: `s3File-${hash}-pdf`},
      {tag: 's3Asset.find-duplicate'},
    )
    expect(uploadAsset).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
    expect(events).toEqual([
      {
        type: 'complete',
        id: `s3File-${hash}-pdf`,
        asset: existingAsset,
        exists: true,
      },
    ])
  })

  it('uploads and creates a new file asset when duplicate is not found', async () => {
    const file = new File(['pdf'], 'manual.pdf', {type: 'application/pdf'})
    const hash = await getSha1Hash(file)

    const fetch = vi.fn(() => of(null))
    const createdAsset = {
      _id: `s3File-${hash}-pdf`,
      _type: 's3FileAsset',
      assetId: hash,
      extension: 'pdf',
      mimeType: 'application/pdf',
      sha1hash: hash,
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
      fileName: `${hash}.pdf`,
    })

    expect(create).toHaveBeenCalledWith({
      _id: `s3File-${hash}-pdf`,
      _type: 's3FileAsset',
      assetId: hash,
      originalFilename: 'manual.pdf',
      sha1hash: hash,
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
    const file = new File(['image'], 'photo.png', {type: 'image/png'})
    const hash = await getSha1Hash(file)

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
      _id: `s3Image-${hash}-320x200-png`,
      _type: 's3ImageAsset',
      assetId: hash,
      extension: 'png',
      mimeType: 'image/png',
      sha1hash: hash,
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
      fileName: `${hash}-320x200.png`,
    })

    expect(create).toHaveBeenCalledWith({
      _id: `s3Image-${hash}-320x200-png`,
      _type: 's3ImageAsset',
      assetId: hash,
      originalFilename: undefined,
      sha1hash: hash,
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
    const file = new File(['image'], 'photo.png', {type: 'image/png'})
    const hash = await getSha1Hash(file)

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
        _id: `s3File-${hash}-png`,
        _type: 's3ImageAsset',
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

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
      {documentType: 's3ImageAsset', id: `s3File-${hash}-png`},
      {tag: 's3Asset.find-duplicate'},
    )

    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.IMAGE,
      file,
      fileName: `${hash}.png`,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: `s3File-${hash}-png`,
        _type: 's3ImageAsset',
      }),
    )

    expect(revokeObjectURL).toHaveBeenCalledWith('blob://broken-preview')
  })

  it('skips image dimension probing for non-image mime types', async () => {
    const file = new File(['text'], 'notes.txt', {type: 'text/plain'})
    const hash = await getSha1Hash(file)

    const createObjectURL = vi.fn()
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: `s3File-${hash}-txt`,
        _type: 's3ImageAsset',
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

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
      fileName: `${hash}.txt`,
    })
  })

  it('uploads without duplicate lookup when hash generation returns an empty value', async () => {
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
      },
    })

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

  it('builds video metadata with dimensions in id', async () => {
    const file = new File(['video'], 'clip.mp4', {type: 'video/mp4'})
    const hash = await getSha1Hash(file)

    const createObjectURL = vi.fn(() => 'blob://video-preview')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class VideoMock {
      videoWidth = 1920
      videoHeight = 1080
      preload = ''
      onloadedmetadata: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onloadedmetadata?.()
      }

      removeAttribute = vi.fn()
      load = vi.fn()
    }

    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'video') {
          return new VideoMock()
        }

        return {}
      }),
    })

    const fetch = vi.fn(() => of(null))
    const createdAsset = {
      _id: `s3Video-${hash}-1920x1080-mp4`,
      _type: 's3VideoAsset',
      assetId: hash,
      extension: 'mp4',
      mimeType: 'video/mp4',
      sha1hash: hash,
      size: 5,
      metadata: {
        _type: 's3VideoMetadata',
        dimensions: {
          _type: 's3VideoDimensions',
          width: 1920,
          height: 1080,
          aspectRatio: 1920 / 1080,
        },
      },
    }
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const events = await collectEvents(
      uploadS3Asset({
        file,
        assetType: S3AssetType.VIDEO,
        options: {storeOriginalFilename: false},
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $documentType && _id == $id][0]',
      {documentType: 's3VideoAsset', id: `s3Video-${hash}-1920x1080-mp4`},
      {tag: 's3Asset.find-duplicate'},
    )

    expect(uploadAsset).toHaveBeenCalledWith({
      assetType: S3AssetType.VIDEO,
      file,
      fileName: `${hash}-1920x1080.mp4`,
    })

    expect(create).toHaveBeenCalledWith({
      _id: `s3Video-${hash}-1920x1080-mp4`,
      _type: 's3VideoAsset',
      assetId: hash,
      originalFilename: undefined,
      sha1hash: hash,
      extension: 'mp4',
      mimeType: 'video/mp4',
      size: 5,
      metadata: {
        _type: 's3VideoMetadata',
        dimensions: {
          _type: 's3VideoDimensions',
          width: 1920,
          height: 1080,
          aspectRatio: 1920 / 1080,
        },
      },
    })

    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob://video-preview')
    expect(events).toEqual([{type: 'complete', id: createdAsset._id, asset: createdAsset}])
  })

  it('throws when video dimensions cannot be read from a video file', async () => {
    const createObjectURL = vi.fn(() => 'blob://broken-video')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class BrokenVideoMock {
      videoWidth = 0
      videoHeight = 0
      preload = ''
      onloadedmetadata: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onerror?.()
      }

      removeAttribute = vi.fn()
      load = vi.fn()
    }

    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'video') {
          return new BrokenVideoMock()
        }

        return {}
      }),
    })

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() => of(null))
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    await expect(
      lastValueFrom(
        uploadS3Asset({
          file: new File(['video'], 'clip.mp4', {type: 'video/mp4'}),
          assetType: S3AssetType.VIDEO,
          sanityClient: {observable: {fetch, create}} as any,
          s3Client: {observable: {assets: {uploadAsset}}} as any,
        }),
      ),
    ).rejects.toThrow('Unable to determine video dimensions')

    expect(fetch).not.toHaveBeenCalled()
    expect(uploadAsset).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob://broken-video')
  })

  it('throws when forcing VIDEO uploads for non-video mime types', async () => {
    await expect(
      lastValueFrom(
        uploadS3Asset({
          file: new File(['txt'], 'notes.txt', {type: 'text/plain'}),
          assetType: S3AssetType.VIDEO,
          sanityClient: {observable: {fetch: vi.fn(), create: vi.fn()}} as any,
          s3Client: {observable: {assets: {uploadAsset: vi.fn()}}} as any,
        }),
      ),
    ).rejects.toThrow('Unable to determine video dimensions')
  })
})
