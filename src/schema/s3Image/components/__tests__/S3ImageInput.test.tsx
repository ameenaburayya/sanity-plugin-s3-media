import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3ImageInput} from '../S3ImageInput'

type S3ImageInputProps = ComponentProps<typeof S3ImageInput>

const user = userEvent.setup()

const createProps = (overrides: Partial<S3ImageInputProps> = {}) => ({
  elementProps: {
    onFocus: vi.fn(),
    ref: {current: document.createElement('div')},
  } as unknown as S3ImageInputProps['elementProps'],
  id: 'image-field',
  members: [{key: 'asset', kind: 'field', name: 'asset'}] as S3ImageInputProps['members'],
  onChange: vi.fn(),
  path: ['imageField'] as S3ImageInputProps['path'],
  readOnly: false,
  renderAnnotation: vi.fn(),
  renderBlock: vi.fn(),
  renderInlineBlock: vi.fn(),
  renderInput: vi.fn(() => <div>custom-render-input</div>),
  renderItem: vi.fn(),
  renderPreview: vi.fn(),
  schemaType: {name: 's3Image', options: {accept: 'image/*'}} as S3ImageInputProps['schemaType'],
  value: {} as S3ImageInputProps['value'],
  ...overrides,
} as S3ImageInputProps)

describe('S3ImageInput', () => {
  it('renders image upload placeholder for asset field', () => {
    renderWithStore(<S3ImageInput {...createProps()} />)

    expect(screen.getByTestId('s3-image-input')).toBeInTheDocument()
    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Browse'})).toBeInTheDocument()
    expect(screen.queryByTestId('s3-image-input-asset-source')).not.toBeInTheDocument()
  })

  it('renders custom input for non-asset members', () => {
    renderWithStore(
      <S3ImageInput
        {...createProps({
          members: [
            {key: 'asset', kind: 'field', name: 'asset'},
            {key: 'alt', kind: 'field', name: 'alt'},
          ] as S3ImageInputProps['members'],
        })}
      />,
    )

    expect(screen.getByText('custom-render-input')).toBeInTheDocument()
  })

  it('shows read-only messaging when readOnly is true', () => {
    renderWithStore(
      <S3ImageInput
        {...createProps({
          readOnly: true,
        })}
      />,
    )

    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Read only')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Browse'})).toBeDisabled()
  })

  it('disables direct upload when directUploads option is false', () => {
    renderWithStore(<S3ImageInput {...createProps()} />, {options: {directUploads: false}})

    expect(screen.getByText("Can't upload files here")).toBeInTheDocument()
    const uploadButton = screen.getByText('Upload')
    const uploadButtonWrapper = uploadButton.closest('label')

    expect(uploadButtonWrapper).toBeInTheDocument()
    expect(uploadButtonWrapper).toHaveAttribute('data-disabled', 'true')
  })

  it('renders invalid warning for unsupported image and clears the field', async () => {
    const onChange = vi.fn()

    renderWithStore(
      <S3ImageInput
        {...createProps({
          onChange,
          value: {
            asset: {
              _type: 'reference',
              _ref: 's3File-abcdefghijklmnopqrstuvwx-pdf',
            },
          } as S3ImageInputProps['value'],
        })}
      />,
    )

    expect(screen.getByText('Invalid image value')).toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: 'Clear value'}))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({type: 'unset', path: ['asset']})]),
    )
  })

  it('renders upload progress for in-flight uploads', () => {
    renderWithStore(
      <S3ImageInput
        {...createProps({
          value: {
            _upload: {
              file: {
                name: 'upload.png',
                type: 'image/png',
              },
              progress: 44,
              updatedAt: new Date().toISOString(),
            },
          } as S3ImageInputProps['value'],
        })}
      />,
    )

    expect(screen.getByText('Uploading')).toBeInTheDocument()
    expect(screen.getByText('upload.png')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument()
  })

  it('shows stale upload warning and clears stale state on action', async () => {
    const onChange = vi.fn()
    const updatedAt = new Date(Date.now() - 120_000).toISOString()

    renderWithStore(
      <S3ImageInput
        {...createProps({
          onChange,
          value: {
            _upload: {
              file: {
                name: 'stale-image.png',
                type: 'image/png',
              },
              progress: 12,
              updatedAt,
            },
          } as S3ImageInputProps['value'],
        })}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Clear upload'})).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', {name: 'Clear upload'}))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'unset', path: ['_upload']}))
  })
})
