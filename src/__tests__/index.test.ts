import {useS3MediaContext as useS3MediaContextFromContexts} from '../contexts'
import {s3Media, useS3MediaContext} from '../index'
import {s3Media as s3MediaFromPlugin} from '../plugin'

describe('root index exports', () => {
  it('re-exports plugin and context hook', () => {
    expect(s3Media).toBe(s3MediaFromPlugin)
    expect(useS3MediaContext).toBe(useS3MediaContextFromContexts)
  })
})
