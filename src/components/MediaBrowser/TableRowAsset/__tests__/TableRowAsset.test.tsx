import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type RefObject} from 'react'
import type {AssetFromSource} from 'sanity'
import type {S3Asset} from 'sanity-plugin-s3-media-types'
import * as hooks from 'src/hooks'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3FileAsset, mockS3ImageAsset} from 'test/fixtures'

import {TableRowAsset} from '../TableRowAsset'

const user = userEvent.setup()
const SECONDARY_ASSET: S3Asset = {
  ...mockS3FileAsset,
  _id: 's3File-asset-file-2-pdf',
  originalFilename: 'guide.pdf',
}

const mockShiftPressed = (pressed: boolean) => {
  vi.spyOn(hooks, 'useKeyPress').mockReturnValue({current: pressed} as RefObject<boolean>)
}

type RenderOptions = {
  id?: string
  onSelect?: (selection: Array<{kind: 'assetDocumentId'; value: string}>) => void
  selected?: boolean
  preloadedState?: ReturnType<typeof createPreloadedState>
}

const renderTableRowAsset = (options: RenderOptions = {}) => {
  const {
    id = mockS3ImageAsset._id,
    onSelect,
    selected = false,
    preloadedState = createPreloadedState({
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
        lastPicked: mockS3ImageAsset._id,
      },
    }),
  } = options

  return renderWithStore(<TableRowAsset id={id} selected={selected} />, {
    onSelect: onSelect as ((assetFromSource: AssetFromSource[]) => void) | undefined,
    preloadedState,
  })
}

describe('TableRowAsset', () => {
  it('returns null when asset does not exist in state', () => {
    mockShiftPressed(false)
    renderTableRowAsset({
      preloadedState: createPreloadedState({
        assets: {
          allIds: [],
          byIds: {},
        },
      }),
    })

    expect(screen.queryByText(mockS3ImageAsset.originalFilename!)).not.toBeInTheDocument()
  })

  it('opens asset edit dialog when row is clicked in browser mode', async () => {
    mockShiftPressed(false)
    const {store} = renderTableRowAsset()

    await user.click(screen.getByText(mockS3ImageAsset.originalFilename!))

    expect(store.getState().dialog.items).toContainEqual({
      assetId: mockS3ImageAsset._id,
      id: mockS3ImageAsset._id,
      type: 'assetEdit',
    })
  })

  it('calls onSelect when row is clicked in asset-source mode', async () => {
    const onSelect = vi.fn()

    mockShiftPressed(false)
    renderTableRowAsset({onSelect})

    await user.click(screen.getByText(mockS3ImageAsset.originalFilename!))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith([
      {
        kind: 'assetDocumentId',
        value: mockS3ImageAsset._id,
      },
    ])
  })

  it('shift-click picks a range when current row is not picked', async () => {
    mockShiftPressed(true)

    const preloadedState = createPreloadedState({
      assets: {
        allIds: [mockS3ImageAsset._id, SECONDARY_ASSET._id],
        byIds: {
          [mockS3ImageAsset._id]: {
            _type: 'asset',
            asset: mockS3ImageAsset,
            picked: false,
            updating: false,
          },
          [SECONDARY_ASSET._id]: {
            _type: 'asset',
            asset: SECONDARY_ASSET,
            picked: false,
            updating: false,
          },
        },
        lastPicked: mockS3ImageAsset._id,
      },
    })

    const {store} = renderTableRowAsset({id: SECONDARY_ASSET._id, preloadedState})

    await user.click(screen.getByText(SECONDARY_ASSET.originalFilename!))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(true)
    expect(store.getState().assets.byIds[SECONDARY_ASSET._id].picked).toBe(true)
    expect(store.getState().assets.lastPicked).toBe(SECONDARY_ASSET._id)
  })

  it('shift-click toggles off an already picked row', async () => {
    mockShiftPressed(true)

    const preloadedState = createPreloadedState({
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
        lastPicked: mockS3ImageAsset._id,
      },
    })

    const {store} = renderTableRowAsset({preloadedState})

    await user.click(screen.getByText(mockS3ImageAsset.originalFilename!))

    expect(store.getState().assets.byIds[mockS3ImageAsset._id].picked).toBe(false)
  })

  it('does not open dialog when selected row is clicked', async () => {
    mockShiftPressed(false)
    const {store} = renderTableRowAsset({selected: true})

    await user.click(screen.getByText(mockS3ImageAsset.originalFilename!))

    expect(store.getState().dialog.items).toEqual([])
  })
})
