import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import {mockS3VideoAsset} from 'test/fixtures'

import {FileIcon} from '../FileIcon'

const user = userEvent.setup()

vi.mock('react-file-icon', () => ({
  FileIcon: ({extension}: {extension?: string}) => (
    <div data-extension={extension || ''} data-testid="react-file-icon" />
  ),
  defaultStyles: {
    mp4: {},
    pdf: {},
  },
}))

describe('FileIcon', () => {
  it('renders file extension icon when no video asset is provided', () => {
    renderWithStore(<FileIcon extension="pdf" width="40%" />)

    expect(screen.getByTestId('react-file-icon')).toHaveAttribute('data-extension', 'pdf')
  })

  it('renders a video preview for video assets', () => {
    renderWithStore(<FileIcon asset={mockS3VideoAsset} width="40%" />)

    const video = screen.getByTestId('file-icon-video')

    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', expect.stringContaining('https://cdn.example.com/'))
    expect(video).toHaveAttribute('src', expect.stringContaining('.mp4'))
  })

  it('calls the click handler when the icon is clicked', async () => {
    const onClick = vi.fn()

    renderWithStore(<FileIcon extension="pdf" onClick={onClick} width="40%" />)

    await user.click(screen.getByTestId('react-file-icon'))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(expect.any(Object))
  })
})
