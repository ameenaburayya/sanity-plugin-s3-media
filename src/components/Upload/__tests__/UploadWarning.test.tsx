import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {UploadWarning} from '../UploadWarning'

const user = userEvent.setup()

describe('UploadWarning', () => {
  it('renders stale upload warning content', () => {
    renderWithStore(<UploadWarning onClearStale={vi.fn()} />)

    expect(screen.getByText('Incomplete upload')).toBeInTheDocument()
    expect(
      screen.getByText(/An upload has made no progress for at least .*and likely got interrupted\./),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Clear upload'})).toBeInTheDocument()
  })

  it('clears stale uploads when action button is clicked', async () => {
    const onClearStale = vi.fn()

    renderWithStore(<UploadWarning onClearStale={onClearStale} />)

    await user.click(
      screen.getByRole('button', {name: 'Clear upload'}),
    )

    expect(onClearStale).toHaveBeenCalledTimes(1)
    expect(onClearStale).toHaveBeenCalledWith(expect.any(Object))
  })
})
