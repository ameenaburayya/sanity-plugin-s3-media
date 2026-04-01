import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {UploadItem} from 'src/types'
import {createPreloadedState} from 'test/fixtures'

import {TableRowUpload} from '../TableRowUpload'

const user = userEvent.setup()
const UPLOAD_ID = 'upload-row-1'

const buildUploadItem = (overrides: Partial<UploadItem> = {}): UploadItem => ({
  _type: 'upload',
  assetType: S3AssetType.IMAGE,
  hash: UPLOAD_ID,
  name: 'promo.mp4',
  objectUrl: 'blob:promo-preview',
  percent: 35,
  size: 4096,
  status: 'uploading',
  ...overrides,
})

const renderTableRowUpload = (
  options: {
    includeUpload?: boolean
    itemOverrides?: Partial<UploadItem>
  } = {},
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

  return renderWithStore(<TableRowUpload id={UPLOAD_ID} />, {preloadedState})
}

describe('TableRowUpload', () => {
  it('returns null when upload item does not exist', () => {
    renderTableRowUpload({includeUpload: false})

    expect(screen.queryByText(/promo\\.mp4/i)).not.toBeInTheDocument()
  })

  it('renders filename and queued status', () => {
    renderTableRowUpload({
      itemOverrides: {
        percent: 0,
        status: 'queued',
      },
    })

    expect(screen.getByText(/promo\.mp4/i)).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()
  })

  it('shows progress and cancels upload when cancel button is clicked', async () => {
    const {store} = renderTableRowUpload({
      itemOverrides: {
        percent: 35,
        status: 'uploading',
      },
    })

    expect(screen.getByText('35%')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(store.getState().uploads.byIds[UPLOAD_ID]).toBeUndefined()
    expect(store.getState().uploads.allIds).not.toContain(UPLOAD_ID)
  })

  it('renders verifying status and hides cancel button for complete uploads', () => {
    renderTableRowUpload({
      itemOverrides: {
        percent: 100,
        status: 'complete',
      },
    })

    expect(screen.getByText('Verifying')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('hides cancel button once upload reaches 100 percent', () => {
    renderTableRowUpload({
      itemOverrides: {
        percent: 100,
        status: 'uploading',
      },
    })

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
