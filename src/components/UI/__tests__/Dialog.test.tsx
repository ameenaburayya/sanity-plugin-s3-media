import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {Dialog} from '../Dialog'

const user = userEvent.setup()

describe('Dialog', () => {
  it('renders dialog body content', () => {
    renderWithStore(
      <Dialog id="example" header="Example">
        <div>Dialog body</div>
      </Dialog>,
    )

    expect(screen.getByText('Dialog body')).toBeInTheDocument()
  })

  it('renders footer buttons and handles cancel click', async () => {
    const onClose = vi.fn()

    renderWithStore(
      <Dialog
        id="example"
        header="Example"
        onClose={onClose}
        footer={{
          description: 'Footer description',
          cancelButton: {},
          confirmButton: {text: 'Apply changes'},
        }}
      >
        <div>Dialog body</div>
      </Dialog>,
    )

    expect(screen.getByText('Footer description')).toBeInTheDocument()
    expect(screen.getByText('Apply changes')).toBeInTheDocument()

    await user.click(screen.getByTestId('cancel-button'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses translated confirm text when not overridden', () => {
    renderWithStore(
      <Dialog
        id="example"
        header="Example"
        onClose={vi.fn()}
        footer={{
          confirmButton: {},
        }}
      />,
    )

    expect(screen.getByTestId('confirm-button')).toHaveTextContent(
      'Confirm',
    )
  })
})
