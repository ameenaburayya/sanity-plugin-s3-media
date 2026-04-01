import {S3ImageInput} from '../components'
import {s3Image} from '../s3Image'

type S3ImageSchema = typeof s3Image


describe('s3Image schema', () => {
  it('defines object schema with required image reference and custom field renderer', () => {
    const schema: S3ImageSchema = s3Image

    expect(schema.name).toBe('s3Image')
    expect(schema.type).toBe('object')

    const [assetField] = schema.fields

    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3ImageAsset'},
    })

    const required = vi.fn(() => 'required-rule')

    expect(
      (assetField.validation as (rule: {required: () => unknown}) => unknown)({required}),
    ).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)
    expect(required).toHaveBeenCalledWith()

    expect(schema.components?.input).toBe(S3ImageInput)

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
