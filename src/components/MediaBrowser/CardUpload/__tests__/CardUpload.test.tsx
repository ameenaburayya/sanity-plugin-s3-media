import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {UploadItem} from 'src/types'
import {createPreloadedState} from 'test/fixtures'

import {CardUpload} from '../CardUpload'

const user = userEvent.setup()
const UPLOAD_ID = 'upload-1'

const buildUploadItem = (overrides: Partial<UploadItem> = {}): UploadItem => ({
  _type: 'upload',
  assetType: S3AssetType.IMAGE,
  hash: UPLOAD_ID,
  name: 'hero.jpg',
  objectUrl: 'blob:hero-preview',
  percent: 42,
  size: 1024,
  status: 'uploading',
  ...overrides,
})

const renderCardUpload = (
  options: {includeUpload?: boolean; itemOverrides?: Partial<UploadItem>} = {},
) => {
  const {includeUpload = true, itemOverrides = {}} = options

  const preloadedState = includeUpload
    ? createPreloadedState({
        uploads: {
          allIds: [UPLOAD_ID],
          byIds: {
            [UPLOAD_ID]: buildUploadItem(itemOverrides),
          },
        },
      })
    : createPreloadedState({
        uploads: {
          allIds: [],
          byIds: {},
        },
      })

  return renderWithStore(<CardUpload id={UPLOAD_ID} />, {preloadedState})
}

describe('CardUpload', () => {
  it('returns null when upload item is missing', () => {
    renderCardUpload({includeUpload: false})

    expect(screen.queryByText(/hero\\.jpg/i)).not.toBeInTheDocument()
  })

  it('renders upload name and queued status', () => {
    renderCardUpload({
      itemOverrides: {
        percent: 0,
        status: 'queued',
      },
    })

    expect(screen.getByText(/hero\.jpg/i)).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()
  })

  it('renders upload progress and cancels upload when cancel button is clicked', async () => {
    const {store} = renderCardUpload({
      itemOverrides: {
        percent: 42,
        status: 'uploading',
      },
    })

    expect(screen.getByText('42%')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(store.getState().uploads.byIds[UPLOAD_ID]).toBeUndefined()
    expect(store.getState().uploads.allIds).not.toContain(UPLOAD_ID)
  })

  it('shows verifying status and hides cancel button for complete uploads', () => {
    renderCardUpload({
      itemOverrides: {
        percent: 100,
        status: 'complete',
      },
    })

    expect(screen.getByText('Verifying')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('hides cancel button when upload progress reaches 100 percent', () => {
    renderCardUpload({
      itemOverrides: {
        percent: 100,
        status: 'uploading',
      },
    })

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
