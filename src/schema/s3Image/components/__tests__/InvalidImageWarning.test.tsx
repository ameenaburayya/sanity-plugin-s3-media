import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {InvalidImageWarning} from '../InvalidImageWarning'

const user = userEvent.setup()

describe('InvalidImageWarning', () => {
  it('renders warning copy and clears value when requested', async () => {
    const onClearValue = vi.fn()

    renderWithStore(<InvalidImageWarning onClearValue={onClearValue} />)

    expect(screen.getByTestId('invalid-image-warning')).toBeInTheDocument()
    expect(screen.getByText('Invalid image value')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The current value is not a valid image reference. This might be due to a schema change or data corruption.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Clear value'}))

    expect(onClearValue).toHaveBeenCalledTimes(1)
    expect(onClearValue).toHaveBeenCalledWith()
  })
})
