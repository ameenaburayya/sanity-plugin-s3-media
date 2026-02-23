import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {S3AssetType} from '../../../types'
import {uploadVideo} from '../uploadVideo'

const setMock = vi.hoisted(() => vi.fn((value, path) => ({type: 'set', value, path})))
const unsetMock = vi.hoisted(() => vi.fn((path) => ({type: 'unset', path})))

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    set: setMock,
    unset: unsetMock,
  }
})

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

    const createdAsset = {
      _id: 's3Video-assethash-1920x1080-mp4',
      _type: 's3VideoAsset',
      assetId: 'assethash',
      extension: 'mp4',
      mimeType: 'video/mp4',
      sha1hash: 'assethash',
      size: 11,
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

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of(uploadProgressEvent, {type: 'response'}))

    const events = await lastValueFrom(
      uploadVideo({
        file,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
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
