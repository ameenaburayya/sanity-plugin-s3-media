import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {AssetGridVirtualized} from '../AssetGridVirtualized'

const user = userEvent.setup()

type VirtuosoGridProps = {
  endReached?: (index: number) => void
  itemContent: (index: number) => ReactNode
  totalCount: number
}

vi.mock('react-virtuoso', () => ({
  VirtuosoGrid: ({totalCount, itemContent, endReached}: VirtuosoGridProps) => (
    <div>
      <button onClick={() => endReached?.(totalCount)} type="button">
        Load more
      </button>
      {Array.from({length: totalCount}, (_, index) => `asset-grid-item-${index}`).map(
        (itemId, index) => (
          <div key={itemId}>{itemContent(index)}</div>
        ),
      )}
    </div>
  ),
}))

describe('AssetGridVirtualized', () => {
  it('renders asset and upload cells and marks selected assets', () => {
    renderWithStore(
      <AssetGridVirtualized
        items={[
          {id: mockS3ImageAsset._id, type: 'asset'},
          {id: 'upload-1', type: 'upload'},
        ]}
      />,
      {
        preloadedState: createPreloadedState({
          selected: {
            assets: [mockS3ImageAsset],
          },
          uploads: {
            allIds: ['upload-1'],
            byIds: {
              'upload-1': {
                _type: 'upload',
                assetType: S3AssetType.IMAGE,
                hash: 'upload-1',
                name: 'upload-1.png',
                objectUrl: 'blob:upload-1',
                percent: 30,
                size: 1024,
                status: 'uploading',
              },
            },
          },
        }),
      },
    )

    expect(screen.getByText('hero.jpg')).toBeInTheDocument()
    expect(screen.getByText(/upload-1\.png/i)).toBeInTheDocument()
    expect(screen.getByTestId('card-asset-selected-icon')).toBeInTheDocument()
  })

  it('calls onLoadMore when virtual grid reaches the end', async () => {
    const onLoadMore = vi.fn()

    renderWithStore(
      <AssetGridVirtualized
        items={[{id: mockS3ImageAsset._id, type: 'asset'}]}
        onLoadMore={onLoadMore}
      />,
    )

    await user.click(screen.getByRole('button', {name: 'Load more'}))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
    expect(onLoadMore).toHaveBeenCalledWith(1)
  })

  it('renders nothing when there are no items', () => {
    renderWithStore(<AssetGridVirtualized items={[]} />)

    expect(screen.queryByTestId('card-asset-selected-icon')).not.toBeInTheDocument()
    expect(screen.queryByText('hero.jpg')).not.toBeInTheDocument()
  })
})
