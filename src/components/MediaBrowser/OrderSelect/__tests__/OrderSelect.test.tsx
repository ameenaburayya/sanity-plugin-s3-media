import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {OrderSelect} from '../OrderSelect'

const user = userEvent.setup()

describe('OrderSelect', () => {
  it('shows the current order title on the trigger button', () => {
    renderWithStore(<OrderSelect />)

    expect(screen.getByRole('button', {name: 'Last created: Newest first'})).toBeInTheDocument()
  })

  it('updates order in redux state when a menu option is selected', async () => {
    const {store} = renderWithStore(<OrderSelect />)

    await user.click(screen.getByRole('button', {name: 'Last created: Newest first'}))
    await user.click(await screen.findByRole('menuitem', {name: 'File name: A to Z', hidden: true}))

    expect(store.getState().assets.order).toEqual({
      direction: 'asc',
      field: 'originalFilename',
    })
  })

  it('disables the currently selected order option', async () => {
    renderWithStore(<OrderSelect />, {
      preloadedState: createPreloadedState({
        assets: {
          order: {
            direction: 'asc',
            field: 'originalFilename',
          },
        },
      }),
    })

    await user.click(screen.getByRole('button', {name: 'File name: A to Z'}))

    expect(
      await screen.findByRole('menuitem', {name: 'File name: A to Z', hidden: true}),
    ).toBeDisabled()
  })
})
