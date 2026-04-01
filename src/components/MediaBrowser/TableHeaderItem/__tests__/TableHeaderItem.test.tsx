import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {TableHeaderItem} from '../TableHeaderItem'

const user = userEvent.setup()

describe('TableHeaderItem', () => {
  it('renders the provided title', () => {
    renderWithStore(<TableHeaderItem field="originalFilename" title="Filename" />)

    expect(screen.getByText('Filename')).toBeInTheDocument()
  })

  it('sets ascending order when clicking an inactive sortable column', async () => {
    const {store} = renderWithStore(<TableHeaderItem field="size" title="Size" />, {
      preloadedState: createPreloadedState({
        assets: {
          order: {
            direction: 'desc',
            field: '_updatedAt',
          },
        },
      }),
    })

    await user.click(screen.getByText('Size'))

    expect(store.getState().assets.order).toEqual({
      direction: 'asc',
      field: 'size',
    })
  })

  it('toggles order direction when clicking the active column', async () => {
    const {store} = renderWithStore(<TableHeaderItem field="size" title="Size" />, {
      preloadedState: createPreloadedState({
        assets: {
          order: {
            direction: 'asc',
            field: 'size',
          },
        },
      }),
    })

    await user.click(screen.getByText('Size'))

    expect(store.getState().assets.order).toEqual({
      direction: 'desc',
      field: 'size',
    })
  })

  it('does not dispatch ordering when field is not provided', async () => {
    const {store} = renderWithStore(<TableHeaderItem title="Not sortable" />, {
      preloadedState: createPreloadedState({
        assets: {
          order: {
            direction: 'desc',
            field: '_updatedAt',
          },
        },
      }),
    })

    await user.click(screen.getByText('Not sortable'))

    expect(store.getState().assets.order).toEqual({
      direction: 'desc',
      field: '_updatedAt',
    })
  })
})
