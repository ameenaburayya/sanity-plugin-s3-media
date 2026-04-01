import {Menu} from '@sanity/ui'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {ActionsMenu} from '../ActionsMenu'

const user = userEvent.setup()

describe('ActionsMenu', () => {
  it('renders upload and browse actions plus clear action', () => {
    renderWithStore(
      <Menu>
        <ActionsMenu
          upload={<div>Upload action</div>}
          browse={<div>Browse action</div>}
          onReset={vi.fn()}
        />
      </Menu>,
    )

    expect(screen.getByText('Upload action')).toBeInTheDocument()
    expect(screen.getByText('Browse action')).toBeInTheDocument()
    expect(
      screen.getByText('Clear field'),
    ).toBeInTheDocument()
  })

  it('downloads and copies url when url is provided', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: vi.fn(() => 'blob://placeholder'),
      })
    }
    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: vi.fn(),
      })
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      blob: vi.fn().mockResolvedValue(new Blob(['file-bytes'])),
    } as unknown as Response)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText},
    })

    renderWithStore(
      <Menu>
        <ActionsMenu
          upload={null}
          browse={null}
          onReset={vi.fn()}
          url="https://cdn.example.com/file.pdf"
        />
      </Menu>,
    )

    await user.click(
      screen.getByRole('menuitem', {name: 'Download'}),
    )
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('https://cdn.example.com/file.pdf', {method: 'GET'})

    await user.click(
      screen.getByRole('menuitem', {name: 'Copy URL'}),
    )

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('https://cdn.example.com/file.pdf')
    expect(
      await screen.findByText('The URL is copied to the clipboard'),
    ).toBeInTheDocument()
  })

  it('disables clear action in read only mode', () => {
    renderWithStore(
      <Menu>
        <ActionsMenu upload={null} browse={null} onReset={vi.fn()} readOnly />
      </Menu>,
    )

    expect(
      screen.getByRole('menuitem', {name: 'Clear field'}),
    ).toBeDisabled()
  })
})
