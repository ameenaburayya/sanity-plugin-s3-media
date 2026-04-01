import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {ButtonViewGroup} from '../ButtonViewGroup'

const user = userEvent.setup()

describe('ButtonViewGroup', () => {
  it('renders both view toggle buttons', () => {
    renderWithStore(<ButtonViewGroup />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('switches to table view when the list button is clicked', async () => {
    const {store} = renderWithStore(<ButtonViewGroup />, {
      preloadedState: createPreloadedState({
        assets: {
          view: 'grid',
        },
      }),
    })

    const buttons = screen.getAllByRole('button')

    await user.click(buttons[1])

    expect(store.getState().assets.view).toBe('table')
  })

  it('switches to grid view when the grid button is clicked', async () => {
    const {store} = renderWithStore(<ButtonViewGroup />, {
      preloadedState: createPreloadedState({
        assets: {
          view: 'table',
        },
      }),
    })

    const buttons = screen.getAllByRole('button')

    await user.click(buttons[0])

    expect(store.getState().assets.view).toBe('grid')
  })
})
