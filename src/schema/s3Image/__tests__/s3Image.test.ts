import {s3Image} from '..'

const defineTypeMock = vi.hoisted(() => vi.fn((schema) => schema))
const defineFieldMock = vi.hoisted(() => vi.fn((field) => field))
const s3ImageInput = vi.hoisted(() => Symbol('S3ImageInput'))

vi.mock('sanity', () => ({
  defineType: defineTypeMock,
  defineField: defineFieldMock,
}))

vi.mock('../components', () => ({
  S3ImageInput: s3ImageInput,
}))

describe('s3Image schema', () => {
  it('defines object schema with required image reference and custom field renderer', () => {
    const schema = s3Image as any
    expect(schema.name).toBe('s3Image')
    expect(schema.type).toBe('object')

    const [assetField] = schema.fields as any[]
    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3ImageAsset'},
    })

    const required = vi.fn(() => 'required-rule')
    expect((assetField.validation as (rule: any) => unknown)({required})).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)

    expect(schema.components.input).toBe(s3ImageInput)

    const renderDefault = vi.fn(() => 'rendered-field')
    const result = (schema.components.field as (props: any) => unknown)({name: 'asset', renderDefault})
    expect(result).toBe('rendered-field')
    expect(renderDefault).toHaveBeenCalledWith({name: 'asset', renderDefault, level: 0})
  })
})
