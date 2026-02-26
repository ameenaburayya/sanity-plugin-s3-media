import {isS3AssetUrl, isS3FileUrl, isS3ImageUrl, isS3VideoUrl} from '../urls'

describe('urls', () => {
  const fileUrl = 'https://cdn.example.com/assets/abc123.pdf'
  const imageUrl = 'https://cdn.example.com/assets/abc123-120x80.jpg'
  const videoUrl = 'https://cdn.example.com/assets/abc123-1920x1080.mp4'

  it('detects generic asset urls', () => {
    expect(isS3AssetUrl(fileUrl)).toBe(true)
    expect(isS3AssetUrl(imageUrl)).toBe(true)
    expect(isS3AssetUrl(videoUrl)).toBe(true)
    expect(isS3AssetUrl('https://cdn.example.com/assets/not-an-asset')).toBe(false)
  })

  it('detects file/image/video urls specifically', () => {
    expect(isS3FileUrl(fileUrl)).toBe(true)
    expect(isS3FileUrl(imageUrl)).toBe(false)

    expect(isS3ImageUrl(imageUrl)).toBe(true)
    expect(isS3ImageUrl(videoUrl)).toBe(false)

    expect(isS3VideoUrl(videoUrl)).toBe(true)
    expect(isS3VideoUrl(fileUrl)).toBe(false)
  })
})
