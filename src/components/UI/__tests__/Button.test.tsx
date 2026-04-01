import {SearchIcon} from '@sanity/icons'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {Button} from '../Button'

const user = userEvent.setup()

describe('Button', () => {
  it('renders button text and handles click', async () => {
    const onClick = vi.fn()

    renderWithStore(<Button text="Save" onClick={onClick} />)

    await user.click(screen.getByRole('button', {name: 'Save'}))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('supports icon-only button with tooltip', async () => {
    renderWithStore(
      <Button
        icon={SearchIcon}
        tooltipProps={{content: 'Search assets', placement: 'top'}}
        aria-label="Search"
      />,
    )

    await user.hover(screen.getByRole('button', {name: 'Search'}))

    expect(await screen.findByText('Search assets')).toBeInTheDocument()
  })
})
