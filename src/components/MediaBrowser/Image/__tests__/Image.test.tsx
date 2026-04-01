import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {Image} from '../Image'

const user = userEvent.setup()

describe('Image', () => {
  it('renders an image element with the provided source', () => {
    render(<Image alt="Preview" src="https://cdn.example.com/hero.jpg" />)

    expect(screen.getByRole('img', {name: 'Preview'})).toHaveAttribute(
      'src',
      'https://cdn.example.com/hero.jpg',
    )
  })

  it('calls onClick when the image is clicked', async () => {
    const handleClick = vi.fn()

    render(<Image alt="Preview" onClick={handleClick} src="https://cdn.example.com/hero.jpg" />)

    await user.click(screen.getByRole('img', {name: 'Preview'}))

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
  })
})
