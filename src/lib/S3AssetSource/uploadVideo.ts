import {concat, of} from 'rxjs'
import {map} from 'rxjs/operators'
import {set} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {UPLOAD_STATUS_KEY} from '../../constants'
import type {S3Uploader} from '../../types'
import {CLEANUP_EVENT, createInitialUploadEvent, createUploadEvent} from '../../utils'
import {uploadS3Asset} from './assets'

export const uploadVideo: S3Uploader = (props) => {
  const {s3Client, sanityClient, file, options} = props

  const upload$ = uploadS3Asset({
    file,
    options,
    s3Client,
    sanityClient,
    assetType: S3AssetType.VIDEO,
  }).pipe(
    map((event) => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress']),
          set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updated']),
        ])
      }
      return createUploadEvent([
        set(event.percent, [UPLOAD_STATUS_KEY, 'progress']),
        set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updated']),
      ])
    }),
  )

  return concat(of(createInitialUploadEvent(file)), upload$, of(CLEANUP_EVENT))
}
