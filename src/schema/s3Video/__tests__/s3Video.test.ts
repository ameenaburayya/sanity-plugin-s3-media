import {S3FileInput} from '../../s3File/components'
import {s3Video} from '../s3Video'

type S3VideoSchema = typeof s3Video


describe('s3Video schema', () => {
  it('defines object schema with required video reference', () => {
    const schema: S3VideoSchema = s3Video

    expect(schema.name).toBe('s3Video')
    expect(schema.type).toBe('object')

    const [assetField] = schema.fields

    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3VideoAsset'},
    })

    const required = vi.fn(() => 'required-rule')

    expect(
      (assetField.validation as (rule: {required: () => unknown}) => unknown)({required}),
    ).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)
    expect(required).toHaveBeenCalledWith()

    expect(schema.components?.input).toBe(S3FileInput)

    const renderDefault = vi.fn(() => 'rendered-field')
    const fieldRenderer = schema.components?.field as ((props: unknown) => unknown) | undefined
    const result = fieldRenderer?.({
      name: 'asset',
      renderDefault,
    })

    expect(result).toBe('rendered-field')
    expect(renderDefault).toHaveBeenCalledTimes(1)
    expect(renderDefault).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'asset',
        renderDefault,
        level: 0,
      }),
    )
  })
})
