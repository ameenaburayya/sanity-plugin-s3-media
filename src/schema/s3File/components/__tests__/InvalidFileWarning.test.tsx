import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {InvalidFileWarning} from '../InvalidFileWarning'

const user = userEvent.setup()

describe('InvalidFileWarning', () => {
  it('renders warning copy and triggers reset action', async () => {
    const onClearValue = vi.fn()

    renderWithStore(<InvalidFileWarning onClearValue={onClearValue} />)

    expect(screen.getByTestId('invalid-file-warning')).toBeInTheDocument()
    expect(screen.getByText('Invalid file value')).toBeInTheDocument()
    expect(
      screen.getByText('The value of this field is not a valid file. Please reset this field.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Reset value'}))

    expect(onClearValue).toHaveBeenCalledTimes(1)
    expect(onClearValue).toHaveBeenCalledWith(expect.any(Object))
  })
})
