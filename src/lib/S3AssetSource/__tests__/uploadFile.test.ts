import {lastValueFrom, of} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {S3AssetType} from '../../../types'
import {uploadFile} from '../uploadFile'

const setMock = vi.hoisted(() => vi.fn((value, path) => ({type: 'set', value, path})))
const uploadS3AssetMock = vi.hoisted(() => vi.fn())
const createUploadEventMock = vi.hoisted(() => vi.fn((patches) => ({type: 'uploadProgress', patches})))
const createInitialUploadEventMock = vi.hoisted(() => vi.fn((file) => ({type: 'initial', file})))

vi.mock('sanity', () => ({
  set: setMock,
}))

vi.mock('../../../utils', () => ({
  CLEANUP_EVENT: {type: 'cleanup'},
  createInitialUploadEvent: createInitialUploadEventMock,
  createUploadEvent: createUploadEventMock,
}))

vi.mock('../assets', () => ({
  uploadS3Asset: uploadS3AssetMock,
}))

describe('uploadFile', () => {
  it('emits initial, progress, completion, and cleanup events', async () => {
    const file = new File(['body'], 'manual.pdf', {type: 'application/pdf'})

    uploadS3AssetMock.mockReturnValue(
      of(
        {
          type: 'progress',
          stage: 'upload',
          percent: 40,
          lengthComputable: true,
        },
        {
          type: 'complete',
          asset: {_id: 's3File-asset-pdf'},
          id: 's3File-asset-pdf',
        },
      ),
    )

    const events = await lastValueFrom(
      uploadFile({
        file,
        sanityClient: {} as any,
        s3Client: {} as any,
        options: {storeOriginalFilename: false},
      }).pipe(toArray()),
    )

    expect(uploadS3AssetMock).toHaveBeenCalledWith({
      file,
      options: {storeOriginalFilename: false},
      s3Client: {},
      sanityClient: {},
      assetType: S3AssetType.FILE,
    })

    expect(createInitialUploadEventMock).toHaveBeenCalledWith(file)

    expect(setMock).toHaveBeenCalledWith(40, ['_upload', 'progress'])
    expect(setMock).toHaveBeenCalledWith(expect.any(String), ['_upload', 'updated'])
    expect(setMock).toHaveBeenCalledWith({_type: 'reference', _ref: 's3File-asset-pdf'}, ['asset'])
    expect(setMock).toHaveBeenCalledWith(100, ['_upload', 'progress'])

    expect(createUploadEventMock).toHaveBeenCalledTimes(2)
    expect(events).toEqual([
      {type: 'initial', file},
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
            value: {_type: 'reference', _ref: 's3File-asset-pdf'},
            path: ['asset'],
          },
          {type: 'set', value: 100, path: ['_upload', 'progress']},
          {type: 'set', value: expect.any(String), path: ['_upload', 'updated']},
        ],
      },
      {type: 'cleanup'},
    ])
  })
})
