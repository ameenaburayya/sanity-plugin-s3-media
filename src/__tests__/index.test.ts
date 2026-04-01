import {useS3MediaContext as useS3MediaContextFromContexts} from '../contexts'
import {s3Media as s3MediaFromPlugin} from '../plugin'

// Runtime sanity check for public package entrypoint exports.
describe('public API', () => {
  it('exports plugin and context hook', () => {
    expect(s3MediaFromPlugin).toBeDefined()
    expect(typeof useS3MediaContextFromContexts).toBe('function')
  })
})
