import {screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {Items} from '../Items'

type VirtuosoProps = {
  groupCounts?: number[]
  groupContent?: (index: number) => ReactNode
  itemContent: (index: number) => ReactNode
}

type VirtuosoGridProps = {
  itemContent: (index: number) => ReactNode
  totalCount: number
}

vi.mock('react-virtuoso', () => ({
  GroupedVirtuoso: ({groupCounts, groupContent, itemContent}: VirtuosoProps) => {
    const count = groupCounts?.[0] || 0

    return (
      <div>
        <button type="button">Table load more</button>
        {groupContent?.(0)}
        {Array.from({length: count}, (_, index) => `items-group-${index}`).map((itemId, index) => (
          <div key={itemId}>{itemContent(index)}</div>
        ))}
      </div>
    )
  },
  VirtuosoGrid: ({totalCount, itemContent}: VirtuosoGridProps) => (
    <div>
      <button type="button">Grid load more</button>
      {Array.from({length: totalCount}, (_, index) => `items-grid-${index}`).map(
        (itemId, index) => (
          <div key={itemId}>{itemContent(index)}</div>
        ),
      )}
    </div>
  ),
}))

describe('Items', () => {
  it('renders an empty state when there are no results', () => {
    renderWithStore(<Items />, {
      preloadedState: createPreloadedState({
        assets: {
          allIds: [],
          byIds: {},
          fetchCount: 0,
          fetching: false,
        },
      }),
    })

    expect(screen.getByText('No results for the current query')).toBeInTheDocument()
  })

  it('renders grid view when view is set to grid', () => {
    renderWithStore(<Items />, {
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
          view: 'grid',
        },
      }),
    })

    expect(screen.getByRole('button', {name: 'Grid load more'})).toBeInTheDocument()
    expect(screen.getByText('hero.jpg')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Table load more'})).not.toBeInTheDocument()
  })

  it('renders table view when view is set to table', () => {
    renderWithStore(<Items />, {
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
          view: 'table',
        },
      }),
    })

    expect(screen.getByRole('button', {name: 'Table load more'})).toBeInTheDocument()
    expect(screen.getByText('Filename')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Grid load more'})).not.toBeInTheDocument()
  })
})
