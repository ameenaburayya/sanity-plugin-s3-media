import {screen} from '@testing-library/react'
import {assetsActions} from 'src/modules'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {Dialogs} from '../Dialogs'

describe('Dialogs', () => {
  it('renders nothing when no dialogs are queued', () => {
    renderWithStore(<Dialogs />, {
      preloadedState: createPreloadedState({
        dialog: {
          items: [],
        },
      }),
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders queued dialogs recursively in nesting order', () => {
    renderWithStore(<Dialogs />, {
      preloadedState: createPreloadedState({
        dialog: {
          items: [
            {
              confirmCallbackAction: assetsActions.viewSet({view: 'table'}),
              confirmText: 'Yes',
              headerTitle: 'Confirm',
              id: 'confirm-1',
              title: 'Confirm action',
              tone: 'critical',
              type: 'confirm',
            },
            {
              assetId: mockS3ImageAsset._id,
              id: mockS3ImageAsset._id,
              type: 'assetEdit',
            },
          ],
        },
      }),
    })

    expect(screen.getByText('Confirm action')).toBeInTheDocument()
    expect(screen.getByText('Asset details')).toBeInTheDocument()
  })
})
