import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {mockS3ImageAsset} from 'test/fixtures'

import type {S3Client} from '../../S3Client'
import {uploadImage} from '../uploadImage'

const exifMock = vi.hoisted(() => vi.fn())

type MockSanityClient = Pick<SanityClient, 'observable'>
type MockS3Client = Pick<S3Client, 'observable'>

const createSanityClient = (overrides: {
  fetch: unknown
  create: unknown
}): MockSanityClient =>
  ({
    observable: {
      fetch: overrides.fetch,
      create: overrides.create,
    },
  }) as unknown as MockSanityClient

const createS3Client = (overrides: {
  uploadAsset: unknown
}): MockS3Client =>
  ({
    observable: {
      assets: {
        uploadAsset: overrides.uploadAsset,
      },
    },
  }) as unknown as MockS3Client

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
    void this
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

      get src(): string {
        return this.#srcValue
      }

      #srcValue = ''
    }

    vi.stubGlobal('Image', ImageMock as unknown as typeof Image)

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
      of({...mockS3ImageAsset, _id: 's3Image-asset-200x200-png', assetId: 'asset', size: 3}),
    )
    const uploadAsset = vi.fn(() => of(...uploadS3ProgressEvents, {type: 'response'}))

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: createSanityClient({fetch, create}) as unknown as SanityClient,
        s3Client: createS3Client({uploadAsset}) as unknown as S3Client,
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

      get src(): string {
        return this.#srcValue
      }

      #srcValue = ''
    }

    vi.stubGlobal('Image', ImageMock as unknown as typeof Image)

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() =>
      of({...mockS3ImageAsset, _id: 's3Image-asset-200x200-png', assetId: 'asset', size: 3}),
    )
    const uploadAsset = vi.fn(() => of({type: 'response'}))

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: createSanityClient({fetch, create}) as unknown as SanityClient,
        s3Client: createS3Client({uploadAsset}) as unknown as S3Client,
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
