import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {TextInputSearch} from '../TextInputSearch'

const user = userEvent.setup()
const renderSearch = (query = '') =>
  renderWithStore(<TextInputSearch />, {
    preloadedState: createPreloadedState({
      search: {
        query,
      },
    }),
  })

describe('TextInputSearch', () => {
  it('renders search input with placeholder', () => {
    renderSearch()

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })

  it('updates search query in redux state while typing', async () => {
    const {store} = renderSearch()

    await user.type(screen.getByTestId('text-input-search-input'), 'landscape')

    expect(store.getState().search.query).toBe('landscape')
  })

  it('shows clear action when query is not empty', () => {
    renderSearch('tree')

    expect(screen.getByTestId('text-input-search-clear')).toBeInTheDocument()
  })

  it('does not show clear action when query is empty', () => {
    renderSearch('')

    expect(screen.queryByTestId('text-input-search-clear')).not.toBeInTheDocument()
  })

  it('clears query when clear action is clicked', async () => {
    const {store} = renderSearch('forest')

    await user.click(screen.getByTestId('text-input-search-clear'))

    expect(store.getState().search.query).toBe('')
  })
})
