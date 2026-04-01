import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {of} from 'rxjs'
import {renderWithStore} from 'src/test/renderWithStore'
import {mockS3ImageAsset} from 'test/fixtures'

import {S3MediaTool} from '../S3MediaTool'

// Access the observable.fetch mock exposed by the global test setup (mocks HTTP calls)
const observableFetchMock = (
  globalThis as {
    __sanityObservableFetchMock?: ReturnType<typeof vi.fn>
  }
).__sanityObservableFetchMock as ReturnType<typeof vi.fn>

// react-virtuoso must be mocked because jsdom lacks viewport/scroll measurement APIs
// that the library requires for virtualized rendering
type VirtuosoGridProps = {
  totalCount: number
  itemContent: (index: number) => ReactNode
}

type VirtuosoTableProps = {
  groupCounts?: number[]
  groupContent?: (index: number) => ReactNode
  itemContent: (index: number) => ReactNode
}

vi.mock('react-virtuoso', () => ({
  VirtuosoGrid: ({totalCount, itemContent}: VirtuosoGridProps) => (
    <div data-testid="virtuoso-grid">
      {Array.from({length: totalCount}, (_, index) => `s3-media-grid-${index}`).map(
        (itemId, index) => (
          <div key={itemId}>{itemContent(index)}</div>
        ),
      )}
    </div>
  ),
  GroupedVirtuoso: ({groupCounts, groupContent, itemContent}: VirtuosoTableProps) => {
    const count = groupCounts?.[0] || 0

    return (
      <div data-testid="virtuoso-table">
        {groupContent?.(0)}
        {Array.from({length: count}, (_, index) => `s3-media-table-${index}`).map(
          (itemId, index) => (
            <div key={itemId}>{itemContent(index)}</div>
          ),
        )}
      </div>
    )
  },
}))

const user = userEvent.setup()

beforeEach(() => {
  observableFetchMock.mockReturnValue(of({items: []}))
})

describe('S3MediaTool', () => {
  describe('rendering', () => {
    it('shows "Browse Assets" title when rendered as a tool', () => {
      renderWithStore(<S3MediaTool />)

      expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    })

    it('renders search input with placeholder', () => {
      renderWithStore(<S3MediaTool />)

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    })

    it('renders sort button with default "Last created: Newest first" order', () => {
      renderWithStore(<S3MediaTool />)

      expect(screen.getByText('Last created: Newest first')).toBeInTheDocument()
    })

    it('shows empty state message when fetch returns no assets', async () => {
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('No results for the current query')).toBeInTheDocument()
      })
    })
  })

  describe('asset display', () => {
    it('renders fetched assets in grid view', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })
      expect(screen.getByTestId('virtuoso-grid')).toBeInTheDocument()
    })

    it('shows grid view by default and not table view', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByTestId('virtuoso-grid')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('virtuoso-table')).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('updates the search input value when typing', async () => {
      renderWithStore(<S3MediaTool />)

      const input = screen.getByTestId('text-input-search-input')

      await user.type(input, 'landscape')

      expect(input).toHaveValue('landscape')
    })

    it('shows clear button when search has text and clears on click', async () => {
      renderWithStore(<S3MediaTool />)

      expect(screen.queryByTestId('text-input-search-clear')).not.toBeInTheDocument()

      const input = screen.getByTestId('text-input-search-input')

      await user.type(input, 'test')

      expect(screen.getByTestId('text-input-search-clear')).toBeInTheDocument()

      await user.click(screen.getByTestId('text-input-search-clear'))

      expect(input).toHaveValue('')
      expect(screen.queryByTestId('text-input-search-clear')).not.toBeInTheDocument()
    })
  })

  describe('sort order', () => {
    it('renders sort button that opens a menu with all sort options', async () => {
      renderWithStore(<S3MediaTool />)

      await user.click(screen.getByText('Last created: Newest first'))

      await waitFor(() => {
        expect(screen.getByText('Last created: Oldest first')).toBeInTheDocument()
      })
      expect(screen.getByText('Last updated: Newest first')).toBeInTheDocument()
      expect(screen.getByText('Last updated: Oldest first')).toBeInTheDocument()
      expect(screen.getByText('File name: A to Z')).toBeInTheDocument()
      expect(screen.getByText('File name: Z to A')).toBeInTheDocument()
      expect(screen.getByText('File size: Largest first')).toBeInTheDocument()
      expect(screen.getByText('File size: Smallest first')).toBeInTheDocument()
    })
  })

  describe('asset picking', () => {
    it('shows picked bar when an asset is picked via card footer', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      expect(screen.queryByText(/asset.*selected/i)).not.toBeInTheDocument()

      await user.click(screen.getByTestId('card-asset-footer-action'))

      await waitFor(() => {
        expect(screen.getByText('1 asset selected')).toBeInTheDocument()
      })
    })

    it('clears all picks when Deselect is clicked', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-footer-action'))

      await waitFor(() => {
        expect(screen.getByText('1 asset selected')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Deselect'))

      await waitFor(() => {
        expect(screen.queryByText(/asset.*selected/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('delete workflow', () => {
    it('opens confirm dialog when Delete is clicked on picked assets', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-footer-action'))

      await waitFor(() => {
        expect(screen.getByText('1 asset selected')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(screen.getByText('Permanently delete 1 asset?')).toBeInTheDocument()
      })
      expect(
        screen.getByText('This operation cannot be reversed. Are you sure you want to continue?'),
      ).toBeInTheDocument()
      expect(screen.getByText('Yes, delete 1 asset')).toBeInTheDocument()
    })

    it('dismisses confirm dialog when Cancel is clicked', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-footer-action'))

      await waitFor(() => {
        expect(screen.getByText('1 asset selected')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(screen.getByText('Permanently delete 1 asset?')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: 'Cancel'}))

      await waitFor(() => {
        expect(screen.queryByText('Permanently delete 1 asset?')).not.toBeInTheDocument()
      })
    })
  })

  describe('asset edit dialog', () => {
    it('opens asset details dialog when asset preview is clicked', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-preview-click-target'))

      await waitFor(() => {
        expect(screen.getByText('Asset details')).toBeInTheDocument()
      })
    })

    it('shows references section and delete button in asset edit dialog', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-preview-click-target'))

      await waitFor(() => {
        expect(screen.getByText('Asset details')).toBeInTheDocument()
      })

      expect(screen.getByText(/References/)).toBeInTheDocument()

      const deleteButtons = screen.getAllByRole('button', {name: 'Delete'})

      expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('opens delete confirm from the asset edit dialog', async () => {
      observableFetchMock.mockReturnValue(of({items: [mockS3ImageAsset]}))
      renderWithStore(<S3MediaTool />)

      await waitFor(() => {
        expect(screen.getByText('hero.jpg')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('card-asset-preview-click-target'))

      await waitFor(() => {
        expect(screen.getByText('Asset details')).toBeInTheDocument()
      })

      // Click the Delete button inside the edit dialog footer
      const deleteButtons = screen.getAllByRole('button', {name: 'Delete'})

      await user.click(deleteButtons[deleteButtons.length - 1])

      await waitFor(() => {
        expect(screen.getByText('Permanently delete 1 asset?')).toBeInTheDocument()
      })
    })
  })

  describe('upload', () => {
    it('renders upload button by default', () => {
      renderWithStore(<S3MediaTool />)

      const uploadButtons = screen.getAllByRole('button', {name: /Upload assets/i})

      expect(uploadButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('hides upload button when directUploads is false', () => {
      renderWithStore(<S3MediaTool />, {options: {directUploads: false}})

      expect(screen.queryByRole('button', {name: /Upload/i})).not.toBeInTheDocument()
    })

    it('renders a hidden file input for the upload dropzone', () => {
      const {container} = renderWithStore(<S3MediaTool />)

      const fileInput = container.querySelector('input[type="file"]')

      expect(fileInput).toBeInTheDocument()
    })

    it('still renders hidden file input when directUploads is false', () => {
      const {container} = renderWithStore(<S3MediaTool />, {options: {directUploads: false}})

      const fileInput = container.querySelector('input[type="file"]')

      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveStyle({display: 'none'})
    })
  })
})
