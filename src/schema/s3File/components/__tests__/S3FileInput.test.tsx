import {screen} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3FileInput} from '../S3FileInput'

type S3FileInputProps = ComponentProps<typeof S3FileInput>

const createProps = (overrides: Partial<S3FileInputProps> = {}) =>
({
  changed: false,
  elementProps: {
    onFocus: vi.fn(),
    ref: {current: document.createElement('div')},
  } as unknown as S3FileInputProps['elementProps'],
  id: 'file-field',
  members: [{key: 'asset-field', kind: 'field'}] as S3FileInputProps['members'],
  onChange: vi.fn(),
  path: ['file-field'] as S3FileInputProps['path'],
  readOnly: false,
  renderAnnotation: vi.fn(),
  renderBlock: vi.fn(),
  renderInlineBlock: vi.fn(),
  renderItem: vi.fn(),
  renderPreview: vi.fn(),
  schemaType: {name: 's3File', options: {accept: 'application/pdf'}} as S3FileInputProps['schemaType'],
  value: {} as S3FileInputProps['value'],
  ...overrides,
} as S3FileInputProps)

describe('S3FileInput', () => {
  it('renders file placeholder for s3File fields', () => {
    renderWithStore(<S3FileInput {...createProps()} />)

    expect(screen.getByTestId('s3-file-input')).toBeInTheDocument()
    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Browse'})).toBeInTheDocument()
  })

  it('renders video placeholder for s3Video fields', () => {
    renderWithStore(
      <S3FileInput
        {...createProps({
          schemaType: {name: 's3Video'} as S3FileInputProps['schemaType'],
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input')).toBeInTheDocument()
    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
  })

  it('respects read-only mode', () => {
    renderWithStore(
      <S3FileInput
        {...createProps({
          readOnly: true,
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input')).toBeInTheDocument()
    expect(screen.getByText('Read only')).toBeInTheDocument()
  })
})
