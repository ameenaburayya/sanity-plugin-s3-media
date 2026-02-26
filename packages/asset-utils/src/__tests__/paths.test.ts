import {
  getS3UrlFilename,
  getS3UrlPath,
  isValidS3Filename,
  tryGetS3UrlFilename,
  tryGetS3UrlPath,
} from '../paths'

describe('isValidS3Filename', () => {
  it('accepts valid filenames', () => {
    expect(isValidS3Filename('abc123.pdf')).toBe(true)
    expect(isValidS3Filename('photo-800x600.jpg')).toBe(true)
    expect(isValidS3Filename('my-file_v2.txt')).toBe(true)
  })

  it('rejects invalid filenames', () => {
    expect(isValidS3Filename('')).toBe(false)
    expect(isValidS3Filename('noextension')).toBe(false)
    expect(isValidS3Filename('has/slash.jpg')).toBe(false)
    expect(isValidS3Filename('has space.jpg')).toBe(false)
  })
})

describe('getS3UrlPath', () => {
  it('extracts path from absolute URLs', () => {
    expect(getS3UrlPath('https://cdn.example.com/assets/abc123.pdf')).toBe('assets/abc123.pdf')
    expect(getS3UrlPath('https://cdn.example.com/abc123-120x80.jpg?w=200')).toBe(
      'abc123-120x80.jpg',
    )
  })

  it('normalizes raw paths', () => {
    expect(getS3UrlPath('/assets/abc123.pdf')).toBe('assets/abc123.pdf')
    expect(getS3UrlPath('assets/abc123.pdf')).toBe('assets/abc123.pdf')
    expect(getS3UrlPath('abc123.pdf?query=1#hash')).toBe('abc123.pdf')
  })

  it('throws on empty or whitespace input', () => {
    expect(() => getS3UrlPath('')).toThrow()
    expect(() => getS3UrlPath('   ')).toThrow()
  })

  it('throws on path inputs that normalize to empty', () => {
    expect(() => getS3UrlPath('/')).toThrow()
    expect(() => getS3UrlPath('///')).toThrow()
  })

  it('throws on URL with no pathname', () => {
    expect(() => getS3UrlPath('https://cdn.example.com')).toThrow()
    expect(() => getS3UrlPath('https://cdn.example.com/')).toThrow()
  })

  it('tryGetS3UrlPath returns undefined instead of throwing', () => {
    expect(tryGetS3UrlPath('')).toBeUndefined()
    expect(tryGetS3UrlPath('https://cdn.example.com')).toBeUndefined()
    expect(tryGetS3UrlPath('https://cdn.example.com/assets/abc.pdf')).toBe('assets/abc.pdf')
  })
})

describe('getS3UrlFilename', () => {
  it('extracts filename from URLs', () => {
    expect(getS3UrlFilename('https://cdn.example.com/assets/abc123.pdf')).toBe('abc123.pdf')
    expect(getS3UrlFilename('https://cdn.example.com/abc123-120x80.jpg?w=200')).toBe(
      'abc123-120x80.jpg',
    )
  })

  it('extracts filename from paths', () => {
    expect(getS3UrlFilename('/assets/abc123.pdf')).toBe('abc123.pdf')
    expect(getS3UrlFilename('abc123.pdf')).toBe('abc123.pdf')
  })

  it('throws on paths without a valid filename', () => {
    expect(() => getS3UrlFilename('https://cdn.example.com/')).toThrow()
    expect(() => getS3UrlFilename('noextension')).toThrow()
  })

  it('tryGetS3UrlFilename returns undefined instead of throwing', () => {
    expect(tryGetS3UrlFilename('noextension')).toBeUndefined()
    expect(tryGetS3UrlFilename('https://cdn.example.com/abc123.pdf')).toBe('abc123.pdf')
  })
})
