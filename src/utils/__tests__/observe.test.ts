import {of} from 'rxjs'
import type {DocumentPreviewStore} from 'sanity'

import {observeFileAsset, observeImageAsset, observeVideoAsset} from '../observe'

const PATHS = ['originalFilename', 'url', 'metadata', 'size', 'mimeType', 'extension']

describe('observe helpers', () => {
  it('observes image and file assets with shared paths', () => {
    const observePaths = vi.fn(() => of({}))
    const store = {observePaths} as unknown as DocumentPreviewStore

    observeImageAsset(store, 'img-id')
    observeFileAsset(store, 'file-id')
    observeVideoAsset(store, 'video-id')

    expect(observePaths).toHaveBeenCalledWith({_type: 'reference', _ref: 'img-id'}, PATHS)
    expect(observePaths).toHaveBeenCalledWith({_type: 'reference', _ref: 'file-id'}, PATHS)
    expect(observePaths).toHaveBeenCalledWith({_type: 'reference', _ref: 'video-id'}, PATHS)
  })
})
