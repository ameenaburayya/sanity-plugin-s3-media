import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {MediaBrowser} from '../MediaBrowser'

const user = userEvent.setup()

describe('MediaBrowser', () => {
  it('renders browser shell sections', () => {
    renderWithStore(<MediaBrowser />)

    expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })

  it('invokes onClose from header close action', async () => {
    const onClose = vi.fn()

    renderWithStore(<MediaBrowser onClose={onClose} />)

    for (const button of screen.getAllByRole('button')) {
      await user.click(button)
      if (onClose.mock.calls.length > 0) {
        break
      }
    }

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith(expect.any(Object))
  })

  it('unmounts cleanly', () => {
    const {unmount} = renderWithStore(<MediaBrowser />)

    unmount()

    expect(screen.queryByText('Browse Assets')).not.toBeInTheDocument()
  })
})
