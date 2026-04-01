import {fireEvent, screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {FileInputButton} from '../FileInputButton'

describe('FileInputButton', () => {
  it('renders a labeled file input with accept and multiple attributes', () => {
    renderWithStore(<FileInputButton text="Upload" accept="image/*" multiple />)

    const input = screen.getByLabelText('Upload') as HTMLInputElement

    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('multiple')
  })

  it('calls onSelect with selected files', () => {
    const onSelect = vi.fn()
    const file = new File(['hello'], 'hello.png', {type: 'image/png'})

    renderWithStore(<FileInputButton text="Upload" onSelect={onSelect} />)

    const input = screen.getByLabelText('Upload') as HTMLInputElement

    fireEvent.change(input, {target: {files: [file]}})

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith([file])
  })

  it('keeps input disabled when disabled prop is true', () => {
    renderWithStore(<FileInputButton text="Upload" disabled />)

    expect(screen.getByLabelText('Upload')).toBeDisabled()
  })
})
