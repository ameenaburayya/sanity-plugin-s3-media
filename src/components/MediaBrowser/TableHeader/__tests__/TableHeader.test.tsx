import {fireEvent, screen} from '@testing-library/react'
import type {AssetFromSource} from 'sanity'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {TableHeader} from '../TableHeader'

const secondAsset = {
  ...mockS3ImageAsset,
  _id: 's3Image-asset-image-2-1200x800-jpg',
  originalFilename: 'second.jpg',
}

const buildPreloadedState = (pickedValues: [boolean, boolean]) =>
  createPreloadedState({
    assets: {
      allIds: [mockS3ImageAsset._id, secondAsset._id],
      byIds: {
        [mockS3ImageAsset._id]: {
          _type: 'asset',
          asset: mockS3ImageAsset,
          picked: pickedValues[0],
          updating: false,
        },
        [secondAsset._id]: {
          _type: 'asset',
          asset: secondAsset,
          picked: pickedValues[1],
          updating: false,
        },
      },
      fetching: false,
    },
  })

describe('TableHeader', () => {
  it('renders table column labels in browse mode', () => {
    renderWithStore(<TableHeader />, {
      preloadedState: buildPreloadedState([false, false]),
    })

    expect(screen.getByText('Filename')).toBeInTheDocument()
    expect(screen.getByText('MIME type')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', {hidden: true})).toBeInTheDocument()
  })

  it('picks all assets when context action is clicked and not all are selected', async () => {
    const {store} = renderWithStore(<TableHeader />, {
      preloadedState: buildPreloadedState([true, false]),
    })

    fireEvent.click(screen.getByTestId('context-action'))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(true)
    expect(store.getState().assets.byIds[secondAsset._id].picked).toBe(true)
  })

  it('clears all picked assets when context action is clicked and all are selected', async () => {
    const {store} = renderWithStore(<TableHeader />, {
      preloadedState: buildPreloadedState([true, true]),
    })

    fireEvent.click(screen.getByTestId('context-action'))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(false)
    expect(store.getState().assets.byIds[secondAsset._id].picked).toBe(false)
  })

  it('hides the context checkbox in asset source mode', () => {
    renderWithStore(<TableHeader />, {
      onSelect: vi.fn((selection: AssetFromSource[]) => {
        void selection
      }),
      preloadedState: buildPreloadedState([false, false]),
    })

    expect(screen.queryByRole('checkbox', {hidden: true})).not.toBeInTheDocument()
  })
})
