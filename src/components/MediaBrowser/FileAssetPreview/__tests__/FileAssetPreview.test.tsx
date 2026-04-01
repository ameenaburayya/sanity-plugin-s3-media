import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'
import {mockS3FileAsset, mockS3VideoAsset} from 'test/fixtures'

import {FileAssetPreview} from '../FileAssetPreview'

describe('FileAssetPreview', () => {
  it('renders audio player for audio assets', () => {
    const audioAsset = {
      ...mockS3FileAsset,
      _id: 's3File-asset-audio-1-mp3',
      extension: 'mp3',
      mimeType: 'audio/mpeg',
    }

    renderWithStore(<FileAssetPreview asset={audioAsset} />)

    const audio = screen.getByTestId('file-preview-audio')

    expect(audio).toBeInTheDocument()
    expect(audio).toHaveAttribute('src', expect.stringContaining('https://cdn.example.com/'))
    expect(audio).toHaveAttribute('src', expect.stringContaining('.mp3'))
  })

  it('renders looping video for video assets', () => {
    renderWithStore(<FileAssetPreview asset={mockS3VideoAsset} />)

    const video = screen.getByTestId('file-preview-video')

    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', expect.stringContaining('https://cdn.example.com/'))
    expect(video).toHaveAttribute('src', expect.stringContaining('.mp4'))
  })

  it('falls back to file icon for generic files', () => {
    renderWithStore(<FileAssetPreview asset={mockS3FileAsset} />)

    expect(screen.queryByTestId('file-preview-audio')).not.toBeInTheDocument()
    expect(screen.queryByTestId('file-preview-video')).not.toBeInTheDocument()
  })
})
