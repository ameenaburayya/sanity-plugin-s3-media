import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {Controls} from '../Controls'

describe('Controls', () => {
  it('renders search, view and order controls', () => {
    renderWithStore(<Controls />)

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /newest first/i})).toBeInTheDocument()
  })

  it('renders while fetching additional pages', () => {
    renderWithStore(<Controls />, {
      preloadedState: createPreloadedState({
        assets: {
          fetching: true,
          pageIndex: 2,
        },
      }),
    })

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /newest first/i})).toBeInTheDocument()
  })
})
