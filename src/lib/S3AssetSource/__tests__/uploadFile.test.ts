import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {mockS3FileAsset} from 'test/fixtures'

import type {S3Client} from '../../S3Client'
import {uploadFile} from '../uploadFile'

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
      ...mockS3FileAsset,
      _id: 's3File-createdasset-pdf',
      assetId: 'createdasset',
      size: 4,
    }

    const fetch = vi.fn(() => of(null))
    const create = vi.fn(() => of(createdAsset))
    const uploadAsset = vi.fn(() => of(uploadProgressEvent, {type: 'response'}))

    const events = await lastValueFrom(
      uploadFile({
        file,
        sanityClient: createSanityClient({fetch, create}) as unknown as SanityClient,
        s3Client: createS3Client({uploadAsset}) as unknown as S3Client,
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
