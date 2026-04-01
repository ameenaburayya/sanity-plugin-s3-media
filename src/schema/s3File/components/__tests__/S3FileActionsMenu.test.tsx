import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {S3FileAsset} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3FileActionsMenu} from '../S3FileActionsMenu'

const user = userEvent.setup()

vi.mock('filesize', () => ({
  filesize: () => '1 kB',
}))

const baseFileAsset = {
  _id: 's3File-file-1-pdf',
  _type: 's3FileAsset',
  extension: 'pdf',
  mimeType: 'application/pdf',
  originalFilename: 'report.pdf',
  size: 1024,
} as unknown as S3FileAsset

describe('S3FileActionsMenu', () => {
  it('renders file metadata preview and opens the options menu', async () => {
    const onMenuOpen = vi.fn()

    renderWithStore(
      <S3FileActionsMenu fileAsset={baseFileAsset} isMenuOpen={false} onMenuOpen={onMenuOpen}>
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    expect(screen.getByTestId('s3-file-actions-menu')).toBeInTheDocument()
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
    expect(screen.getByText('1 kB')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {name: 'Open file options menu'}),
    )

    expect(onMenuOpen).toHaveBeenCalledTimes(1)
    expect(onMenuOpen).toHaveBeenCalledWith(true)
  })

  it('falls back to generated filename when original filename is unavailable', () => {
    renderWithStore(
      <S3FileActionsMenu
        fileAsset={{...baseFileAsset, _id: 's3File-file-2-pdf', originalFilename: undefined} as unknown as S3FileAsset}
        isMenuOpen={false}
        onMenuOpen={vi.fn()}
      >
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    expect(screen.getByText('s3File-file-2-pdf.pdf')).toBeInTheDocument()
  })

  it('renders media previews for video and audio files', () => {
    const {rerender} = renderWithStore(
      <S3FileActionsMenu
        fileAsset={{
          ...baseFileAsset,
          _id: 's3Video-video-1-1920x1080-mp4',
          _type: 's3VideoAsset',
          extension: 'mp4',
          mimeType: 'video/mp4',
        } as unknown as import('sanity-plugin-s3-media-types').S3VideoAsset}
        isMenuOpen={false}
        onMenuOpen={vi.fn()}
      >
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    const video = screen.getByTestId('file-actions-video')

    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', expect.stringContaining('video-1-1920x1080.mp4'))

    rerender(
      <S3FileActionsMenu
        fileAsset={{
          ...baseFileAsset,
          _id: 's3File-audio-1-mp3',
          extension: 'mp3',
          mimeType: 'audio/mpeg',
        } as unknown as S3FileAsset}
        isMenuOpen={false}
        onMenuOpen={vi.fn()}
      >
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    const audio = screen.getByTestId('file-actions-audio')

    expect(audio).toBeInTheDocument()
    expect(audio).toHaveAttribute('src', expect.stringContaining('audio-1.mp3'))
  })

  it('closes on escape and restores focus to the menu button', async () => {
    const onMenuOpen = vi.fn()

    renderWithStore(
      <S3FileActionsMenu fileAsset={baseFileAsset} isMenuOpen onMenuOpen={onMenuOpen}>
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    const button = screen.getByRole('button', {
      name: 'Open file options menu',
    })
    const focusSpy = vi.spyOn(button, 'focus')

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledTimes(1)
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })
    await waitFor(() => {
      expect(focusSpy).toHaveBeenCalledTimes(1)
      expect(focusSpy).toHaveBeenCalledWith()
    })
  })

  it('closes on outside click but ignores clicks on the options button', async () => {
    const onMenuOpen = vi.fn()

    renderWithStore(
      <S3FileActionsMenu fileAsset={baseFileAsset} isMenuOpen onMenuOpen={onMenuOpen}>
        <div>Actions</div>
      </S3FileActionsMenu>,
    )

    const button = screen.getByRole('button', {
      name: 'Open file options menu',
    })

    await user.click(button)
    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledTimes(1)
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })

    await user.click(document.body)

    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })
  })
})
