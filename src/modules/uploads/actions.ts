import {createAction} from '@reduxjs/toolkit'
import type {S3AssetDocument} from 'sanity-plugin-s3-media-types'

export const UPLOADS_ACTIONS = {
  uploadComplete: createAction(
    'uploads/uploadComplete',
    function prepare({asset}: {asset: S3AssetDocument}) {
      return {
        payload: {asset},
      }
    },
  ),
}
