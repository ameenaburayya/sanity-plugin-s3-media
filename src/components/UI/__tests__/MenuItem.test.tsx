import {SearchIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {MenuItem} from '../MenuItem'

const user = userEvent.setup()

describe('MenuItem', () => {
  it('renders text, subtitle, and badge', () => {
    renderWithStore(
      <Menu>
        <MenuItem
          text="Open asset"
          badgeText="NEW"
          __unstable_subtitle="Shortcut"
          icon={SearchIcon}
        />
      </Menu>,
    )

    expect(screen.getByText('Open asset')).toBeInTheDocument()
    expect(screen.getByText('Shortcut')).toBeInTheDocument()
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('applies renderMenuItem override', () => {
    renderWithStore(
      <Menu>
        <MenuItem
          text="Wrapped"
          renderMenuItem={(content) => <div data-testid="wrapped-item">{content}</div>}
        />
      </Menu>,
    )

    expect(screen.getByTestId('wrapped-item')).toBeInTheDocument()
    expect(screen.getByText('Wrapped')).toBeInTheDocument()
  })

  it('supports tooltip on disabled item', async () => {
    renderWithStore(
      <Menu>
        <MenuItem
          text="Disabled"
          disabled
          tooltipProps={{content: 'Disabled reason', placement: 'right'}}
        />
      </Menu>,
    )

    await user.hover(screen.getByText('Disabled'))

    expect(await screen.findByText('Disabled reason')).toBeInTheDocument()
  })

  it('fires click handler', async () => {
    const onClick = vi.fn()

    renderWithStore(
      <Menu>
        <MenuItem text="Click me" onClick={onClick} />
      </Menu>,
    )

    await user.click(screen.getByRole('menuitem', {name: 'Click me'}))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
