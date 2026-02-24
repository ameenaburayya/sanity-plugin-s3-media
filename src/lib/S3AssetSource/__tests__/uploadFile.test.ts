import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {uploadFile} from '../uploadFile'

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

describe('uploadFile', () => {
  it('emits initial, progress, completion, and cleanup events', async () => {
    const file = new File(['body'], 'manual.pdf', {type: 'application/pdf'})

    const uploadProgressEvent = {
      type: 'progress',
      stage: 'upload',
      percent: 40,
      lengthComputable: true,
    }

    const createdAsset = {
      _id: 's3File-createdasset-pdf',
      _type: 's3FileAsset',
      assetId: 'createdasset',
      extension: 'pdf',
      mimeType: 'application/pdf',
      sha1hash: 'createdasset',
      size: 4,
    }

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of(uploadProgressEvent, {type: 'response'}))

    const events = await lastValueFrom(
      uploadFile({
        file,
        sanityClient: {observable: {fetch, create}} as any,
        s3Client: {observable: {assets: {uploadAsset}}} as any,
        options: {storeOriginalFilename: false},
      }).pipe(toArray()),
    )

    expect(uploadAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetType: S3AssetType.FILE,
        file,
        fileName: expect.stringMatching(/\.pdf$/),
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
              file: {name: 'manual.pdf', type: 'application/pdf'},
            }),
            path: ['_upload'],
          },
        ],
      },
      {
        type: 'uploadProgress',
        patches: [
          {type: 'set', value: 40, path: ['_upload', 'progress']},
          {type: 'set', value: expect.any(String), path: ['_upload', 'updated']},
        ],
      },
      {
        type: 'uploadProgress',
        patches: [
          {
            type: 'set',
            value: {_type: 'reference', _ref: 's3File-createdasset-pdf'},
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
