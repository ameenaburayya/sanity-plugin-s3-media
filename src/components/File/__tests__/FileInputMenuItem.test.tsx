import {Menu} from '@sanity/ui'
import {fireEvent, screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {FileInputMenuItem} from '../FileInputMenuItem'

describe('FileInputMenuItem', () => {
  it('renders menu item text and hidden file input', () => {
    renderWithStore(
      <Menu>
        <FileInputMenuItem text="Upload file" />
      </Menu>,
    )

    expect(screen.getByText('Upload file')).toBeInTheDocument()
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('calls onSelect with selected files', () => {
    const onSelect = vi.fn()
    const file = new File(['hi'], 'note.pdf', {type: 'application/pdf'})

    renderWithStore(
      <Menu>
        <FileInputMenuItem text="Upload file" onSelect={onSelect} />
      </Menu>,
    )

    fireEvent.change(screen.getByTestId('file-input'), {target: {files: [file]}})

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith([file])
  })

  it('passes disabled state to file input', () => {
    renderWithStore(
      <Menu>
        <FileInputMenuItem text="Upload file" disabled />
      </Menu>,
    )

    expect(screen.getByTestId('file-input')).toBeDisabled()
  })
})
