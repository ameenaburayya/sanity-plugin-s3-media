import {createAction} from '@reduxjs/toolkit'
import type {S3AssetDocument} from '../../types'

export const UPLOADS_ACTIONS = {
  uploadComplete: createAction(
    'uploads/uploadComplete',
    function prepare({asset}: {asset: S3AssetDocument}) {
      return {
        payload: {asset},
      }
    }
  ),
}
