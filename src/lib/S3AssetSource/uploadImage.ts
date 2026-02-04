import {concat, merge, of} from 'rxjs'
import {catchError, filter, map} from 'rxjs/operators'
import {set} from 'sanity'

import {UPLOAD_STATUS_KEY} from '../../constants'
import {uploadS3Asset} from './assets'
import {readExif} from './readExif'
import {CLEANUP_EVENT, createInitialUploadEvent, createUploadEvent} from '../../utils'
import {S3AssetType, type S3Uploader} from '../../types'

export const uploadImage: S3Uploader = (props) => {
  const {sanityClient, s3Client, file, options} = props

  const upload$ = uploadS3Asset({
    file,
    options,
    s3Client,
    sanityClient,
    assetType: S3AssetType.IMAGE,
  }).pipe(
    filter((event) => (event.type === 'progress' ? event.stage !== 'download' : true)),
    map((event) => ({
      ...event,
      progress: event.type === 'progress' ? 2 + (event.percent / 100) * 98 : 0,
    })),

    map((event) => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress']),
          set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
        ])
      }

      return createUploadEvent([
        set(event.percent, [UPLOAD_STATUS_KEY, 'progress']),
        set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
      ])
    })
  )

  const setPreviewUrl$ = readExif(file).pipe(
    catchError((error) => {
      console.warn(
        'Image preprocessing failed for "%s" with the error: %s',
        file.name,
        error.message
      )

      // something went wrong, but continue still
      return of(null)
    }),
    filter(Boolean),
    map((imageUrl) => createUploadEvent([set(imageUrl, [UPLOAD_STATUS_KEY, 'previewImage'])]))
  )

  return concat(
    of(createInitialUploadEvent(file)),
    merge(upload$, setPreviewUrl$),
    of(CLEANUP_EVENT)
  )
}
