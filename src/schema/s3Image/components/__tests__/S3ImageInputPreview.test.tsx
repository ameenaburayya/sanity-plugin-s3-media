import {act, screen, waitFor} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import type {S3ImageInputProps} from '../../types'
import {S3ImageInputPreview} from '../S3ImageInputPreview'

describe('S3ImageInputPreview', () => {
  const createImageInputValue = (
    value: S3ImageInputProps['value'],
  ): S3ImageInputProps['value'] => value

  it('renders image preview for referenced asset', () => {
    renderWithStore(
      <S3ImageInputPreview
        readOnly={false}
        value={createImageInputValue({asset: {_type: 'reference', _ref: 's3Image-preview-1-1200x800-jpg'}})}
      />,
    )

    const image = screen.getByRole('img', {name: 'Preview of uploaded image'})

    expect(image).toBeInTheDocument()
    expect(screen.getByTestId('s3-image-input-preview')).toBeInTheDocument()
    expect(image).toHaveAttribute('src', expect.stringContaining('preview-1-1200x800.jpg'))
    expect(image).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  })

  it('shows access warning on image error and clears it on subsequent load', async () => {
    renderWithStore(
      <S3ImageInputPreview
        readOnly={false}
        value={createImageInputValue({asset: {_type: 'reference', _ref: 's3Image-preview-2-1200x800-jpg'}})}
      />,
    )

    const image = screen.getByRole('img', {name: 'Preview of uploaded image'})

    await act(async () => {
      image.dispatchEvent(new Event('error', {bubbles: true}))
    })

    await waitFor(() => {
      expect(screen.getByText('Could not load image. This may be due to access restrictions.')).toBeInTheDocument()
    })

    await act(async () => {
      image.dispatchEvent(new Event('load', {bubbles: true}))
    })

    await waitFor(() => {
      expect(
        screen.queryByText('Could not load image. This may be due to access restrictions.'),
      ).not.toBeInTheDocument()
    })
  })

  it('keeps placeholder state when no asset reference exists', () => {
    renderWithStore(<S3ImageInputPreview readOnly value={createImageInputValue({asset: {_type: 'reference', _ref: ''}})} />)

    expect(
      screen.queryByRole('img', {name: 'Preview of uploaded image'}),
    ).not.toBeInTheDocument()
  })
})
