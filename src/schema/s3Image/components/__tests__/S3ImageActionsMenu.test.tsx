import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3ImageActionsMenu, S3ImageActionsMenuWaitPlaceholder} from '../S3ImageActionsMenu'

const user = userEvent.setup()

describe('S3ImageActionsMenu', () => {
  it('renders a wait placeholder skeleton', () => {
    renderWithStore(<S3ImageActionsMenuWaitPlaceholder />)

    expect(screen.getByTestId('image-actions-placeholder')).toBeInTheDocument()
  })

  it('toggles menu state and exposes the menu button element', async () => {
    const onMenuOpen = vi.fn()
    const setMenuButtonElement = vi.fn()

    const {rerender} = renderWithStore(
      <S3ImageActionsMenu
        isMenuOpen={false}
        onMenuOpen={onMenuOpen}
        setMenuButtonElement={setMenuButtonElement}
      >
        <div>Menu content</div>
      </S3ImageActionsMenu>,
    )

    expect(screen.getByTestId('s3-image-actions-menu')).toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: 'Open image options menu'}))

    expect(onMenuOpen).toHaveBeenCalledTimes(1)
    expect(onMenuOpen).toHaveBeenCalledWith(true)
    expect(setMenuButtonElement).toHaveBeenCalledTimes(3)
    expect(setMenuButtonElement).toHaveBeenCalledWith(expect.any(HTMLButtonElement))

    onMenuOpen.mockClear()

    rerender(
      <S3ImageActionsMenu
        isMenuOpen
        onMenuOpen={onMenuOpen}
        setMenuButtonElement={setMenuButtonElement}
      >
        <div>Menu content</div>
      </S3ImageActionsMenu>,
    )

    await user.click(screen.getByRole('button', {name: 'Open image options menu'}))

    expect(onMenuOpen).toHaveBeenCalledTimes(1)
    expect(onMenuOpen).toHaveBeenCalledWith(false)
  })

  it('closes the menu on escape key and restores focus to the button', async () => {
    const onMenuOpen = vi.fn()

    renderWithStore(
      <S3ImageActionsMenu isMenuOpen onMenuOpen={onMenuOpen} setMenuButtonElement={vi.fn()}>
        <div>Menu content</div>
      </S3ImageActionsMenu>,
    )

    const button = screen.getByRole('button', {
      name: 'Open image options menu',
    })

    expect(screen.getByTestId('s3-image-actions-menu')).toBeInTheDocument()
    const focusSpy = vi.spyOn(button, 'focus')

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledTimes(1)
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })
    await waitFor(() => {
      expect(focusSpy).toHaveBeenCalledTimes(1)
      expect(focusSpy).toHaveBeenCalledWith()
    })
  })

  it('closes menu on outside click but not on menu button click', async () => {
    const onMenuOpen = vi.fn()

    renderWithStore(
      <S3ImageActionsMenu isMenuOpen onMenuOpen={onMenuOpen} setMenuButtonElement={vi.fn()}>
        <div>Menu content</div>
      </S3ImageActionsMenu>,
    )

    const button = screen.getByRole('button', {
      name: 'Open image options menu',
    })

    await user.click(button)
    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledTimes(1)
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })

    await user.click(document.body)

    await waitFor(() => {
      expect(onMenuOpen).toHaveBeenCalledWith(false)
    })
  })
})
