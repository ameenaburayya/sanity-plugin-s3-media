import {combineEpics} from 'redux-observable'

import {dialogClearOnAssetUpdateEpic} from './dialog'

import {
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteSkippedEpic,
  notificationsGenericErrorEpic,
  notificationsAssetsUploadCompleteEpic,
} from './notifications'

import {
  assetsDeleteEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsUnpickEpic,
  assetsUpdateEpic,
} from './assets'

import {
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic,
} from './uploads'

export const rootEpic = combineEpics(
  assetsDeleteEpic,
  assetsFetchEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsUnpickEpic,
  assetsUpdateEpic,
  dialogClearOnAssetUpdateEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsDeleteSkippedEpic,
  notificationsAssetsUploadCompleteEpic,
  notificationsGenericErrorEpic,
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic
)
