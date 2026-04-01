import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {UploadState} from 'sanity'
import {renderWithStore} from 'src/test/renderWithStore'

import {STALE_UPLOAD_MS} from '../../../constants'
import {UploadProgress} from '../UploadProgress'

const user = userEvent.setup()

describe('UploadProgress', () => {
  it('renders filename and upload label', () => {
    const uploadState = {
      file: {name: 'upload-file.jpg'},
      progress: 33,
      updatedAt: new Date().toISOString(),
    } as UploadState

    renderWithStore(<UploadProgress uploadState={uploadState} />)

    expect(screen.getByText(/Uploading/)).toBeInTheDocument()
    expect(screen.getByText('upload-file.jpg')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const uploadState = {
      file: {name: 'upload-file.jpg'},
      progress: 80,
      updatedAt: new Date().toISOString(),
    } as UploadState

    renderWithStore(<UploadProgress uploadState={uploadState} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', {name: 'Cancel'}))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledWith(expect.any(Object))
  })

  it('does not render cancel button when handler is omitted', () => {
    const uploadState = {
      file: {name: 'upload-file.jpg'},
      progress: 33,
      updatedAt: new Date().toISOString(),
    } as UploadState

    renderWithStore(<UploadProgress uploadState={uploadState} />)

    expect(screen.queryByRole('button', {name: 'Cancel'})).not.toBeInTheDocument()
  })

  it('calls onStale when the upload has exceeded the stale threshold', async () => {
    const onStale = vi.fn()
    const uploadState = {
      file: {name: 'upload-file.jpg'},
      progress: 20,
      updatedAt: new Date(Date.now() - STALE_UPLOAD_MS - 500).toISOString(),
    } as UploadState

    renderWithStore(<UploadProgress uploadState={uploadState} onStale={onStale} />)

    await waitFor(() => {
      expect(onStale).toHaveBeenCalledTimes(1)
      expect(onStale).toHaveBeenCalledWith()
    })
  })
})
