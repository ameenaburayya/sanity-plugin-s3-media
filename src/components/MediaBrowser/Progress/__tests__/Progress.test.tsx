import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {Progress} from '../Progress'

const useNProgressMock = vi.fn()

vi.mock('@tanem/react-nprogress', () => ({
  useNProgress: (options: unknown) => useNProgressMock(options),
}))

describe('Progress', () => {
  it('maps loading state into nprogress hook options', () => {
    useNProgressMock.mockReturnValue({
      animationDuration: 300,
      isFinished: false,
      progress: 0.25,
    })

    renderWithStore(<Progress loading />)

    expect(useNProgressMock).toHaveBeenCalledTimes(1)
    expect(useNProgressMock).toHaveBeenCalledWith({
      animationDuration: 300,
      isAnimating: true,
    })
  })

  it('renders width from progress value and keeps indicator visible while in progress', () => {
    useNProgressMock.mockReturnValue({
      animationDuration: 300,
      isFinished: false,
      progress: 0.4,
    })

    renderWithStore(<Progress loading />)

    const wrapper = screen.getByTestId('progress-wrapper')
    const bar = screen.getByTestId('progress-bar')

    expect(wrapper).toHaveStyle({opacity: '1'})
    expect(bar).toHaveStyle({width: '40%'})
  })

  it('hides the indicator when progress is finished', () => {
    useNProgressMock.mockReturnValue({
      animationDuration: 300,
      isFinished: true,
      progress: 1,
    })

    renderWithStore(<Progress loading={false} />)

    const wrapper = screen.getByTestId('progress-wrapper')

    expect(wrapper).toHaveStyle({opacity: '0'})
  })
})
