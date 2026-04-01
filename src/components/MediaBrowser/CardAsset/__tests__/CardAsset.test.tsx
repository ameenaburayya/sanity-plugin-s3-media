import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {AssetFromSource} from 'sanity'
import type {S3Asset} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import {type AssetItem} from 'src/types'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {CardAsset} from '../CardAsset'

const user = userEvent.setup()
const typedMockImageAsset = mockS3ImageAsset as S3Asset
const baseAssetItem: AssetItem = {
  _type: 'asset',
  asset: typedMockImageAsset,
  picked: false,
  updating: false,
}

type CardOptions = {
  selected?: boolean
  onSelect?: (selection: Array<{kind: 'assetDocumentId'; value: string}>) => void
  itemOverrides?: Partial<{
    error: string
    picked: boolean
    updating: boolean
  }>
  includeAsset?: boolean
}

const renderCard = (options: CardOptions = {}) => {
  const {selected = false, onSelect, itemOverrides = {}, includeAsset = true} = options
  const assetId = mockS3ImageAsset._id

  const preloadedState = includeAsset
    ? createPreloadedState({
        assets: {
          allIds: [assetId],
          byIds: {
            [assetId]: {
              ...baseAssetItem,
              ...itemOverrides,
            },
          },
          lastPicked: assetId,
        },
      })
    : createPreloadedState({
        assets: {
          allIds: [],
          byIds: {},
        },
      })

  return renderWithStore(<CardAsset id={assetId} selected={selected} />, {
    onSelect: onSelect as (assetFromSource: AssetFromSource[]) => void,
    preloadedState,
  })
}

describe('CardAsset', () => {
  it('renders the asset filename', () => {
    renderCard()

    expect(screen.getByText('hero.jpg')).toBeInTheDocument()
  })

  it('returns null when the asset is not in store', () => {
    renderCard({includeAsset: false})

    expect(screen.queryByText('hero.jpg')).not.toBeInTheDocument()
  })

  it('shows selected icon when selected and not updating', () => {
    renderCard({selected: true})

    expect(screen.getByTestId('card-asset-selected-icon')).toBeInTheDocument()
  })

  it('shows spinner when asset is updating', () => {
    renderCard({itemOverrides: {updating: true}})

    expect(screen.getByTestId('card-asset-spinner')).toBeInTheDocument()
  })

  it('shows error indicator when item has an error', () => {
    renderCard({itemOverrides: {error: 'Upload failed'}})

    expect(screen.getByTestId('card-asset-error')).toBeInTheDocument()
  })

  it('dispatches showAssetEdit when preview is clicked in browser mode', async () => {
    const {store} = renderCard()

    await user.click(screen.getByTestId('card-asset-preview-click-target'))

    expect(store.getState().dialog.items).toContainEqual({
      assetId: mockS3ImageAsset._id,
      id: mockS3ImageAsset._id,
      type: 'assetEdit',
    })
  })

  it('calls onSelect when preview is clicked in asset-source mode', async () => {
    const onSelect = vi.fn()

    renderCard({onSelect})

    await user.click(screen.getByTestId('card-asset-preview-click-target'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith([
      {
        kind: 'assetDocumentId',
        value: mockS3ImageAsset._id,
      },
    ])
  })

  it('dispatches pick action when footer action is clicked', async () => {
    const {store} = renderCard()

    await user.click(screen.getByTestId('card-asset-footer-action'))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(true)
  })
})
