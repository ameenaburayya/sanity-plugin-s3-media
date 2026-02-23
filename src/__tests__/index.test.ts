import {s3Media, useS3MediaContext} from '../index'

vi.mock('../plugin', () => ({
  s3Media: 'plugin-export',
}))

vi.mock('../contexts', () => ({
  useS3MediaContext: 'context-hook',
}))

describe('root index exports', () => {
  it('re-exports plugin and context hook', () => {
    expect(s3Media).toBe('plugin-export')
    expect(useS3MediaContext).toBe('context-hook')
  })
})
