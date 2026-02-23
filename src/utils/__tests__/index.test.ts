import {accepts} from '../accepts'
import {hashFile} from '../file'
import {imageUrlToBlob} from '../imageUrlToBlob'
import * as utils from '../index'
import {constructFilter} from '../mediaBrowser'
import {observeFileAsset} from '../observe'
import {getS3AssetDocumentId} from '../resolve'
import {createUploadEvent} from '../upload'
import {withMaxConcurrency} from '../withMaxConcurrency'

describe('utils index exports', () => {
  it('re-exports utility modules', () => {
    expect(utils.accepts).toBe(accepts)
    expect(utils.hashFile).toBe(hashFile)
    expect(utils.imageUrlToBlob).toBe(imageUrlToBlob)
    expect(utils.constructFilter).toBe(constructFilter)
    expect(utils.observeFileAsset).toBe(observeFileAsset)
    expect(utils.getS3AssetDocumentId).toBe(getS3AssetDocumentId)
    expect(utils.createUploadEvent).toBe(createUploadEvent)
    expect(utils.withMaxConcurrency).toBe(withMaxConcurrency)
  })
})
