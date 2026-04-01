import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {forwardRef, type HTMLAttributes} from 'react'

import {UploadFileTarget} from '../UploadFileTarget'

const BaseTarget = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function BaseTarget(props, ref) {
    return (
      <div {...props} ref={ref} tabIndex={0}>
        Drop files here
      </div>
    )
  },
)

const FileTarget = UploadFileTarget(BaseTarget)

const createDataTransfer = (
  files: File[] = [],
  items = files.map((file) => ({kind: 'file', type: file.type})),
): DataTransfer =>
  ({
    files,
    items,
    getData: () => '',
  }) as unknown as DataTransfer

describe('UploadFileTarget', () => {
  it('emits dropped files and notifies when the drag state ends', async () => {
    const onFiles = vi.fn()
    const onFilesOut = vi.fn()
    const file = new File(['hello'], 'image.png', {type: 'image/png'})

    render(<FileTarget onFiles={onFiles} onFilesOut={onFilesOut} />)

    fireEvent.drop(screen.getByText('Drop files here'), {
      dataTransfer: createDataTransfer([file]),
    })

    await waitFor(() => {
      expect(onFiles).toHaveBeenCalledTimes(1)
      expect(onFiles).toHaveBeenCalledWith([file])
    })
    expect(onFilesOut).toHaveBeenCalledTimes(1)
    expect(onFilesOut).toHaveBeenCalledWith()
  })

  it('reports hovered files on drag enter and clears hover state on drag leave', () => {
    const onFilesOver = vi.fn()
    const onFilesOut = vi.fn()
    const fileItems = [{kind: 'file', type: 'image/png'}]

    render(<FileTarget onFilesOver={onFilesOver} onFilesOut={onFilesOut} />)

    fireEvent.dragEnter(screen.getByText('Drop files here'), {
      dataTransfer: createDataTransfer([], fileItems),
    })

    expect(onFilesOver).toHaveBeenCalledTimes(1)
    expect(onFilesOver).toHaveBeenCalledWith(fileItems)

    fireEvent.dragLeave(screen.getByText('Drop files here'), {
      dataTransfer: createDataTransfer([], fileItems),
    })

    expect(onFilesOut).toHaveBeenCalledTimes(1)
    expect(onFilesOut).toHaveBeenCalledWith()
  })

  it('shows a paste input after Cmd/Ctrl+V and emits pasted files', async () => {
    const onFiles = vi.fn()
    const file = new File(['hello'], 'pasted.png', {type: 'image/png'})

    render(<FileTarget onFiles={onFiles} />)
    const target = screen.getByText('Drop files here')

    target.focus()
    fireEvent.keyDown(target, {ctrlKey: true, key: 'v'})

    const pasteInput = screen.getByTestId('paste-input')

    expect(pasteInput).toBeInTheDocument()

    fireEvent.paste(pasteInput, {
      clipboardData: createDataTransfer([file]),
    })

    await waitFor(() => {
      expect(onFiles).toHaveBeenCalledWith([file])
    })

    await waitFor(() => {
      expect(screen.queryByTestId('paste-input')).not.toBeInTheDocument()
    })
  })

  it('disables drag/drop and paste handling when disabled', () => {
    const onFiles = vi.fn()
    const onFilesOver = vi.fn()
    const onFilesOut = vi.fn()
    const file = new File(['hello'], 'blocked.png', {type: 'image/png'})

    render(
      <FileTarget disabled onFiles={onFiles} onFilesOver={onFilesOver} onFilesOut={onFilesOut} />,
    )
    const target = screen.getByText('Drop files here')

    fireEvent.dragEnter(target, {
      dataTransfer: createDataTransfer([file]),
    })
    fireEvent.drop(target, {
      dataTransfer: createDataTransfer([file]),
    })

    target.focus()
    fireEvent.keyDown(target, {ctrlKey: true, key: 'v'})

    expect(onFilesOver).not.toHaveBeenCalled()
    expect(onFilesOut).not.toHaveBeenCalled()
    expect(onFiles).not.toHaveBeenCalled()
    expect(screen.queryByTestId('paste-input')).not.toBeInTheDocument()
  })
})
