import {of} from 'rxjs'

import {observeFileAsset, observeImageAsset} from '../observe'

const PATHS = ['originalFilename', 'url', 'metadata', 'size', 'mimeType', 'extension']

describe('observe helpers', () => {
  it('observes image and file assets with shared paths', () => {
    const observePaths = vi.fn(() => of({}))
    const store = {observePaths}

    observeImageAsset(store as any, 'img-id')
    observeFileAsset(store as any, 'file-id')

    expect(observePaths).toHaveBeenCalledWith({_type: 'reference', _ref: 'img-id'}, PATHS)
    expect(observePaths).toHaveBeenCalledWith({_type: 'reference', _ref: 'file-id'}, PATHS)
  })
})
