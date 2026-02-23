import {lastValueFrom, of, throwError} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {S3AssetType} from '../../../types'
import {uploadImage} from '../uploadImage'

const setMock = vi.hoisted(() => vi.fn((value, path) => ({type: 'set', value, path})))
const uploadS3AssetMock = vi.hoisted(() => vi.fn())
const readExifMock = vi.hoisted(() => vi.fn())
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

vi.mock('../readExif', () => ({
  readExif: readExifMock,
}))

describe('uploadImage', () => {
  it('filters download progress, emits preview patch, and completes upload', async () => {
    const file = new File(['img'], 'photo.png', {type: 'image/png'})

    uploadS3AssetMock.mockReturnValue(
      of(
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
        {
          type: 'complete',
          asset: {_id: 's3Image-asset-200x200-png'},
          id: 's3Image-asset-200x200-png',
        },
      ),
    )

    readExifMock.mockReturnValue(of('blob://preview'))

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: {} as any,
        s3Client: {} as any,
        options: {storeOriginalFilename: true},
      }).pipe(toArray()),
    )

    expect(uploadS3AssetMock).toHaveBeenCalledWith({
      file,
      options: {storeOriginalFilename: true},
      s3Client: {},
      sanityClient: {},
      assetType: S3AssetType.IMAGE,
    })
    expect(readExifMock).toHaveBeenCalledWith(file)

    expect(setMock).toHaveBeenCalledWith(35, ['_upload', 'progress'])
    expect(setMock).not.toHaveBeenCalledWith(80, ['_upload', 'progress'])
    expect(setMock).toHaveBeenCalledWith('blob://preview', ['_upload', 'previewImage'])
    expect(setMock).toHaveBeenCalledWith(
      {_type: 'reference', _ref: 's3Image-asset-200x200-png'},
      ['asset'],
    )

    expect(events[0]).toEqual({type: 'initial', file})
    expect(events.at(-1)).toEqual({type: 'cleanup'})

    const progressEvents = events.filter((event) => event.type === 'uploadProgress')
    expect(progressEvents).toHaveLength(3)
  })

  it('continues upload when EXIF preprocessing fails', async () => {
    const file = new File(['img'], 'photo.png', {type: 'image/png'})

    uploadS3AssetMock.mockReturnValue(
      of({
        type: 'complete',
        asset: {_id: 's3Image-asset-200x200-png'},
        id: 's3Image-asset-200x200-png',
      }),
    )
    readExifMock.mockReturnValue(throwError(() => new Error('bad exif payload')))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const events = await lastValueFrom(
      uploadImage({
        file,
        sanityClient: {} as any,
        s3Client: {} as any,
      }).pipe(toArray()),
    )

    expect(warnSpy).toHaveBeenCalledWith(
      'Image preprocessing failed for "%s" with the error: %s',
      'photo.png',
      'bad exif payload',
    )

    expect(setMock).not.toHaveBeenCalledWith(expect.anything(), ['_upload', 'previewImage'])
    expect(events).toEqual([
      {type: 'initial', file},
      {
        type: 'uploadProgress',
        patches: [
          {
            type: 'set',
            value: {_type: 'reference', _ref: 's3Image-asset-200x200-png'},
            path: ['asset'],
          },
          {type: 'set', value: 100, path: ['_upload', 'progress']},
          {type: 'set', value: expect.any(String), path: ['_upload', 'updatedAt']},
        ],
      },
      {type: 'cleanup'},
    ])
  })
})
