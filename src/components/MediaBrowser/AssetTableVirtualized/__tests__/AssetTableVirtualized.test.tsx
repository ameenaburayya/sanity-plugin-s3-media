import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {AssetTableVirtualized} from '../AssetTableVirtualized'

const user = userEvent.setup()

type VirtuosoTableProps = {
  endReached?: (index: number) => void
  groupCounts?: number[]
  groupContent?: (index: number) => ReactNode
  itemContent: (index: number) => ReactNode
}

vi.mock('react-virtuoso', () => ({
  GroupedVirtuoso: ({groupCounts, groupContent, itemContent, endReached}: VirtuosoTableProps) => {
    const count = groupCounts?.[0] || 0

    return (
      <div>
        <button onClick={() => endReached?.(count)} type="button">
          Load more
        </button>
        {groupContent?.(0)}
        {Array.from({length: count}, (_, index) => `asset-table-item-${index}`).map(
          (itemId, index) => (
            <div key={itemId}>{itemContent(index)}</div>
          ),
        )}
      </div>
    )
  },
}))

describe('AssetTableVirtualized', () => {
  it('renders header and item rows for asset and upload entries', () => {
    renderWithStore(
      <AssetTableVirtualized
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

    expect(screen.getByText('Filename')).toBeInTheDocument()
    expect(screen.getByText('hero.jpg')).toBeInTheDocument()
    expect(screen.getByText(/upload-1\.png/i)).toBeInTheDocument()
  })

  it('calls onLoadMore when the virtual list reaches the end', async () => {
    const onLoadMore = vi.fn()

    renderWithStore(
      <AssetTableVirtualized
        items={[{id: mockS3ImageAsset._id, type: 'asset'}]}
        onLoadMore={onLoadMore}
      />,
    )

    await user.click(screen.getByRole('button', {name: 'Load more'}))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
    expect(onLoadMore).toHaveBeenCalledWith(1)
  })

  it('renders nothing when items are empty', () => {
    renderWithStore(<AssetTableVirtualized items={[]} />)

    expect(screen.queryByText('Filename')).not.toBeInTheDocument()
    expect(screen.queryByText('hero.jpg')).not.toBeInTheDocument()
  })
})
