import {screen} from '@testing-library/react'
import React from 'react'
import type {ObjectFieldProps} from 'sanity'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3FileInput} from '../components'
import {s3File} from '../s3File'

describe('s3File schema', () => {
  it('defines object schema with required reference field and custom field renderer', () => {
    expect(s3File.name).toBe('s3File')
    expect(s3File.type).toBe('object')

    const [assetField] = s3File.fields

    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3FileAsset'},
    })

    const required = vi.fn(() => 'required-rule')

    expect(
      (assetField.validation as (rule: {required: () => unknown}) => unknown)({required}),
    ).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)
    expect(required).toHaveBeenCalledWith()

    expect(s3File.components?.input).toBe(S3FileInput)

    const renderDefault: ObjectFieldProps['renderDefault'] = vi.fn(() => (
      <div data-testid="rendered-field" />
    ))
    const Field = s3File.components!.field!

    const FieldComponent = Field as React.ComponentType<{renderDefault: typeof renderDefault}>

    renderWithStore(<FieldComponent renderDefault={renderDefault} />)

    expect(screen.getByTestId('rendered-field')).toBeInTheDocument()
    expect(renderDefault).toHaveBeenCalledTimes(1)
    expect(renderDefault).toHaveBeenCalledWith(
      expect.objectContaining({
        renderDefault,
        level: 0,
      }),
    )
  })
})
