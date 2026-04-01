import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {mockS3VideoAsset} from 'test/fixtures'

import type {S3Client} from '../../S3Client'
import {uploadVideo} from '../uploadVideo'

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

describe('uploadVideo', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits initial, progress, completion, and cleanup events for video uploads', async () => {
    const file = new File(['video-bytes'], 'clip.mp4', {type: 'video/mp4'})

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

      get src(): string {
        return this.#srcValue
      }

      #srcValue = ''

      removeAttribute = vi.fn()
      load = vi.fn()
    }

    vi.stubGlobal('document', {
      createElement: vi.fn(() => new VideoMock()),
    })

    const uploadProgressEvent = {
      type: 'progress',
      stage: 'upload',
      percent: 62,
      lengthComputable: true,
    }

    const createdAsset = {...mockS3VideoAsset, _id: 's3Video-assethash-1920x1080-mp4', assetId: 'assethash', size: 11}

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of(uploadProgressEvent, {type: 'response'}))

    const events = await lastValueFrom(
      uploadVideo({
        file,
        sanityClient: createSanityClient({fetch, create}) as unknown as SanityClient,
        s3Client: createS3Client({uploadAsset}) as unknown as S3Client,
        options: {storeOriginalFilename: false},
      }).pipe(toArray()),
    )

    expect(uploadAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetType: S3AssetType.VIDEO,
        file,
        fileName: expect.stringMatching(/-1920x1080\.mp4$/),
      }),
    )

    expect(events).toEqual([
      {
        type: 'uploadProgress',
        patches: [
          {
            type: 'set',
            value: expect.objectContaining({
              progress: 2,
              file: {name: 'clip.mp4', type: 'video/mp4'},
            }),
            path: ['_upload'],
          },
        ],
      },
      {
        type: 'uploadProgress',
        patches: [
          {type: 'set', value: 62, path: ['_upload', 'progress']},
          {type: 'set', value: expect.any(String), path: ['_upload', 'updated']},
        ],
      },
      {
        type: 'uploadProgress',
        patches: [
          {
            type: 'set',
            value: {_type: 'reference', _ref: 's3Video-assethash-1920x1080-mp4'},
            path: ['asset'],
          },
          {type: 'set', value: 100, path: ['_upload', 'progress']},
          {type: 'set', value: expect.any(String), path: ['_upload', 'updated']},
        ],
      },
      {
        type: 'uploadProgress',
        patches: [{type: 'unset', path: ['_upload']}],
      },
    ])
  })
})
