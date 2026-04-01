import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {S3Asset} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3FileAsset, mockS3ImageAsset} from 'test/fixtures'

import {DialogAssetEdit} from '../DialogAssetEdit'

const user = userEvent.setup()
const DIALOG_ID = 'dialog-asset-edit'

const renderDialogAssetEdit = (options: {asset?: S3Asset; includeAsset?: boolean} = {}) => {
  const {asset = mockS3ImageAsset, includeAsset = true} = options

  const preloadedState = includeAsset
    ? createPreloadedState({
        assets: {
          allIds: [asset._id],
          byIds: {
            [asset._id]: {
              _type: 'asset',
              asset,
              picked: false,
              updating: false,
            },
          },
        },
        dialog: {
          items: [
            {
              assetId: asset._id,
              id: DIALOG_ID,
              type: 'assetEdit',
            },
          ],
        },
      })
    : createPreloadedState({
        assets: {
          allIds: [],
          byIds: {},
        },
        dialog: {
          items: [
            {
              assetId: asset._id,
              id: DIALOG_ID,
              type: 'assetEdit',
            },
          ],
        },
      })

  return renderWithStore(
    <DialogAssetEdit
      dialog={{
        assetId: asset._id,
        id: DIALOG_ID,
        type: 'assetEdit',
      }}
    />,
    {preloadedState},
  )
}

describe('DialogAssetEdit', () => {
  it('returns null when the selected asset does not exist in state', () => {
    renderDialogAssetEdit({includeAsset: false})

    expect(screen.queryByRole('dialog', {name: 'Asset details'})).not.toBeInTheDocument()
  })

  it('renders references and image preview for image assets', () => {
    renderDialogAssetEdit()

    expect(screen.getByRole('dialog', {name: 'Asset details'})).toBeInTheDocument()
    expect(screen.getByText('References (1)')).toBeInTheDocument()

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('asset-image-1-800x600.jpg'),
    )
  })

  it('renders file preview for non-image assets', () => {
    const {container} = renderDialogAssetEdit({asset: mockS3FileAsset})

    expect(screen.getByText('application/pdf')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('dispatches confirm delete dialog when delete button is clicked', async () => {
    const {store} = renderDialogAssetEdit()

    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(store.getState().dialog.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          closeDialogId: mockS3ImageAsset._id,
          confirmText: 'Yes, delete 1 asset',
          id: 'confirm',
          type: 'confirm',
        }),
      ]),
    )
  })

  it('removes the dialog entry when close is triggered', async () => {
    const {store} = renderDialogAssetEdit()

    await user.click(screen.getByRole('button', {name: 'Close dialog'}))

    expect(store.getState().dialog.items).toEqual([])
  })
})
