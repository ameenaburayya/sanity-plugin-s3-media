import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {uploadImage} from '../uploadImage'

const setMock = vi.hoisted(() => vi.fn((value, path) => ({type: 'set', value, path})))
const unsetMock = vi.hoisted(() => vi.fn((path) => ({type: 'unset', path})))
const exifMock = vi.hoisted(() => vi.fn())

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    set: setMock,
    unset: unsetMock,
  }
})

vi.mock('exif-component', () => ({
  default: exifMock,
}))

class FileReaderMock {
  result: ArrayBuffer | null = new ArrayBuffer(8)
  onerror: null | ((err: unknown) => void) = null
  onload: null | (() => void) = null

  readAsArrayBuffer(_blob: Blob): void {
    this.onload?.()
  }

  abort(): void {
    // noop
  }
}

describe('uploadImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('filters download progress, emits preview patch, and completes upload', async () => {
    const file = new File(['img'], 'photo.png', {type: 'image/png'})

    exifMock.mockReturnValue('blob://preview')

    const createObjectURL = vi.fn(() => 'blob://image-preview')
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('window', {
      FileReader: FileReaderMock,
      URL: {createObjectURL, revokeObjectURL},
    })
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class ImageMock {
      width = 200
      height = 200
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onload?.()
      }
    }

    vi.stubGlobal('Image', ImageMock as any)

    const uploadS3ProgressEvents = [
      {
        type: 'progress',
        stage: 'upload',
        percent: 35,
        lengthComputable: true,
      },
      {
        type: 'progress',
        stage: 'download',
        percent: 80,
        lengthComputable: true,
      },
    ]

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: 's3Image-asset-200x200-png',
        _type: 's3ImageAsset',
        assetId: 'asset',
        extension: 'png',
        mimeType: 'image/png',
        sha1hash: 'asset',
        size: 3,
      }),
    )
    const uploadAsset = vi.fn(() => of(...uploadS3ProgressEvents, {type: 'response'}))

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
        options: {storeOriginalFilename: true},
      }).pipe(toArray()),
    )

    expect(uploadAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetType: S3AssetType.IMAGE,
        file,
        fileName: expect.stringMatching(/-200x200\.png$/),
      }),
    )

    expect(events[0]).toEqual({
      type: 'uploadProgress',
      patches: [
        {
          type: 'set',
          value: expect.objectContaining({
            progress: 2,
            file: {name: 'photo.png', type: 'image/png'},
          }),
          path: ['_upload'],
        },
      ],
    })

    expect(events.at(-1)).toEqual({
      type: 'uploadProgress',
      patches: [{type: 'unset', path: ['_upload']}],
    })

    const flattenedPatches = events.flatMap((event) => event.patches || [])

    expect(flattenedPatches).toEqual(
      expect.arrayContaining([
        {type: 'set', value: 35, path: ['_upload', 'progress']},
        {type: 'set', value: 'blob://preview', path: ['_upload', 'previewImage']},
        {
          type: 'set',
          value: {_type: 'reference', _ref: 's3Image-asset-200x200-png'},
          path: ['asset'],
        },
      ]),
    )

    expect(flattenedPatches).not.toContainEqual({
      type: 'set',
      value: 80,
      path: ['_upload', 'progress'],
    })
  })

  it('continues upload when image preprocessing emits an unexpected error', async () => {
    const file = new File(['img'], 'photo.png', {type: 'image/png'})

    const poisonedError = {}
    Object.defineProperty(poisonedError, 'message', {
      get() {
        throw new Error('bad exif payload')
      },
    })

    exifMock.mockImplementation(() => {
      throw poisonedError
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const createObjectURL = vi.fn(() => 'blob://image-preview')
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('window', {
      FileReader: FileReaderMock,
      URL: {createObjectURL, revokeObjectURL},
    })
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})

    class ImageMock {
      width = 200
      height = 200
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        this.onload?.()
      }
    }

    vi.stubGlobal('Image', ImageMock as any)

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({
        _id: 's3Image-asset-200x200-png',
        _type: 's3ImageAsset',
        assetId: 'asset',
        extension: 'png',
        mimeType: 'image/png',
        sha1hash: 'asset',
        size: 3,
      }),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
      }).pipe(toArray()),
    )

    expect(warnSpy).toHaveBeenCalledWith(
      'Image preprocessing failed for "%s" with the error: %s',
      'photo.png',
      'bad exif payload',
    )

    const flattenedPatches = events.flatMap((event) => event.patches || [])
    expect(flattenedPatches).not.toContainEqual({
      type: 'set',
      value: expect.anything(),
      path: ['_upload', 'previewImage'],
    })

    expect(flattenedPatches).toEqual(
      expect.arrayContaining([
        {
          type: 'set',
          value: {_type: 'reference', _ref: 's3Image-asset-200x200-png'},
          path: ['asset'],
        },
      ]),
    )
  })
})
