import type {Observable} from 'rxjs'
import type {DocumentPreviewStore} from 'sanity'

import type {S3FileAsset, S3ImageAsset, S3VideoAsset} from '../types'

function observeAssetDoc(documentPreviewStore: DocumentPreviewStore, id: string) {
  return documentPreviewStore.observePaths({_type: 'reference', _ref: id}, [
    'originalFilename',
    'url',
    'metadata',
    'size',
    'mimeType',
    'extension',
  ])
}

export const observeImageAsset = (documentPreviewStore: DocumentPreviewStore, id: string) => {
  return observeAssetDoc(documentPreviewStore, id) as Observable<S3ImageAsset>
}

export const observeFileAsset = (documentPreviewStore: DocumentPreviewStore, id: string) => {
  return observeAssetDoc(documentPreviewStore, id) as Observable<S3FileAsset>
}

export const observeVideoAsset = (documentPreviewStore: DocumentPreviewStore, id: string) => {
  return observeAssetDoc(documentPreviewStore, id) as Observable<S3VideoAsset>
}
