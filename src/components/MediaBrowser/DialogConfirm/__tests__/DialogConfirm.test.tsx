import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {assetsActions} from 'src/modules'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState, mockS3ImageAsset} from 'test/fixtures'

import {DialogConfirm} from '../DialogConfirm'

const user = userEvent.setup()

describe('DialogConfirm', () => {
  it('renders title, description and actions for the confirmation dialog', () => {
    renderWithStore(
      <DialogConfirm
        dialog={{
          confirmCallbackAction: assetsActions.viewSet({view: 'table'}),
          confirmText: 'Yes, continue',
          description: 'This action cannot be undone',
          headerTitle: 'Confirm action',
          id: 'confirm-1',
          title: 'Delete selected assets?',
          tone: 'critical',
          type: 'confirm',
        }}
      />,
    )

    expect(screen.getByText('Confirm action')).toBeInTheDocument()
    expect(screen.getByText('Delete selected assets?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Yes, continue'})).toBeInTheDocument()
  })

  it('removes itself from the dialog stack when cancel is clicked', async () => {
    const dialog = {
      confirmCallbackAction: assetsActions.viewSet({view: 'table'}),
      confirmText: 'Yes, continue',
      headerTitle: 'Confirm action',
      id: 'confirm-1',
      title: 'Delete selected assets?',
      tone: 'critical' as const,
      type: 'confirm' as const,
    }

    const {store} = renderWithStore(<DialogConfirm dialog={dialog} />, {
      preloadedState: createPreloadedState({
        dialog: {
          items: [dialog],
        },
      }),
    })

    await user.click(screen.getByRole('button', {name: 'Cancel'}))

    expect(store.getState().dialog.items).toHaveLength(0)
  })

  it('runs confirm action and removes related dialogs when confirmed', async () => {
    const dialog = {
      closeDialogId: 'asset-edit-1',
      confirmCallbackAction: assetsActions.viewSet({view: 'table'}),
      confirmText: 'Yes, continue',
      headerTitle: 'Confirm action',
      id: 'confirm-1',
      title: 'Delete selected assets?',
      tone: 'critical' as const,
      type: 'confirm' as const,
    }

    const {store} = renderWithStore(<DialogConfirm dialog={dialog} />, {
      preloadedState: createPreloadedState({
        assets: {
          view: 'grid',
        },
        dialog: {
          items: [
            {
              assetId: mockS3ImageAsset._id,
              id: 'asset-edit-1',
              type: 'assetEdit',
            },
            dialog,
          ],
        },
      }),
    })

    await user.click(screen.getByRole('button', {name: 'Yes, continue'}))

    expect(store.getState().assets.view).toBe('table')
    expect(store.getState().dialog.items).toHaveLength(0)
  })
})
