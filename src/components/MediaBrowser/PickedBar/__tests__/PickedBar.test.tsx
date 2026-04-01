import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {PickedBar} from '../PickedBar'

const user = userEvent.setup()
const pickedState = createPreloadedState({
  assets: {
    allIds: [mockS3ImageAsset._id],
    byIds: {
      [mockS3ImageAsset._id]: {
        _type: 'asset',
        asset: mockS3ImageAsset,
        picked: true,
        updating: false,
      },
    },
  },
})

describe('PickedBar', () => {
  it('renders nothing when no assets are picked', () => {
    renderWithStore(<PickedBar />, {
      preloadedState: createPreloadedState({
        assets: {
          allIds: [mockS3ImageAsset._id],
          byIds: {
            [mockS3ImageAsset._id]: {
              _type: 'asset',
              asset: mockS3ImageAsset,
              picked: false,
              updating: false,
            },
          },
        },
      }),
    })

    expect(screen.queryByText('1 asset selected')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Deselect'})).not.toBeInTheDocument()
  })

  it('shows selected asset count', () => {
    renderWithStore(<PickedBar />, {
      preloadedState: pickedState,
    })

    expect(screen.getByText('1 asset selected')).toBeInTheDocument()
  })

  it('clears picked assets when deselect is clicked', async () => {
    const {store} = renderWithStore(<PickedBar />, {
      preloadedState: pickedState,
    })

    await user.click(screen.getByRole('button', {name: 'Deselect'}))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(false)
  })

  it('queues confirm delete dialog when delete is clicked', async () => {
    const {store} = renderWithStore(<PickedBar />, {
      preloadedState: pickedState,
    })

    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(store.getState().dialog.items[0]).toEqual(
      expect.objectContaining({
        confirmText: 'Yes, delete 1 asset',
        title: 'Permanently delete 1 asset?',
        type: 'confirm',
      }),
    )
  })
})
