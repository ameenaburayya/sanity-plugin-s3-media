import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {ButtonAssetCopy} from '../ButtonAssetCopy'

const user = userEvent.setup()
const copyMock = vi.fn()

vi.mock('copy-to-clipboard', () => ({
  default: (...args: unknown[]) => copyMock(...args),
}))

describe('ButtonAssetCopy', () => {
  it('copies the url and shows confirmation popover', async () => {
    renderWithStore(<ButtonAssetCopy url="https://cdn.example.com/file.pdf" />)

    await user.click(screen.getByRole('button', {name: 'Copy URL'}))

    expect(copyMock).toHaveBeenCalledTimes(1)
    expect(copyMock).toHaveBeenCalledWith('https://cdn.example.com/file.pdf')
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('hides the confirmation popover after timeout', async () => {
    renderWithStore(<ButtonAssetCopy url="https://cdn.example.com/file.pdf" />)

    await user.click(screen.getByRole('button', {name: 'Copy URL'}))
    expect(screen.getByText('Copied!')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.getByText('Copied!')).not.toBeVisible()
      },
      {timeout: 2500},
    )
  })

  it('does not copy when disabled', async () => {
    renderWithStore(<ButtonAssetCopy disabled url="https://cdn.example.com/file.pdf" />)

    await user.click(screen.getByRole('button', {name: 'Copy URL'}))

    expect(copyMock).not.toHaveBeenCalled()
  })
})
