import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {Notifications} from '../Notifications'

describe('Notifications', () => {
  it('does not push toasts when there are no notifications', () => {
    renderWithStore(<Notifications />, {
      preloadedState: createPreloadedState({
        notifications: {
          items: [],
        },
      }),
    })

    expect(screen.queryByText('Uploaded 1 asset')).not.toBeInTheDocument()
    expect(screen.queryByText('Skipped 1 asset')).not.toBeInTheDocument()
    expect(screen.queryByText('Unable to delete 1 asset')).not.toBeInTheDocument()
  })

  it('pushes toast for a single notification', async () => {
    renderWithStore(<Notifications />, {
      preloadedState: createPreloadedState({
        notifications: {
          items: [
            {
              status: 'info',
              title: 'Uploaded 1 asset',
            },
          ],
        },
      }),
    })

    expect(await screen.findByText('Uploaded 1 asset')).toBeInTheDocument()
  })

  it('pushes only the latest notification when multiple exist', async () => {
    renderWithStore(<Notifications />, {
      preloadedState: createPreloadedState({
        notifications: {
          items: [
            {
              status: 'warning',
              title: 'Skipped 1 asset',
            },
            {
              status: 'error',
              title: 'Unable to delete 1 asset',
            },
          ],
        },
      }),
    })

    expect(await screen.findByText('Unable to delete 1 asset')).toBeInTheDocument()
    expect(screen.queryByText('Skipped 1 asset')).not.toBeInTheDocument()
  })
})
