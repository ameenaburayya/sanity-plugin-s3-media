import {s3File} from '..'

const defineTypeMock = vi.hoisted(() => vi.fn((schema) => schema))
const defineFieldMock = vi.hoisted(() => vi.fn((field) => field))
const s3FileInput = vi.hoisted(() => Symbol('S3FileInput'))

vi.mock('sanity', () => ({
  defineType: defineTypeMock,
  defineField: defineFieldMock,
}))

vi.mock('../components', () => ({
  S3FileInput: s3FileInput,
}))

describe('s3File schema', () => {
  it('defines object schema with required reference field and custom field renderer', () => {
    const schema = s3File as any
    expect(schema.name).toBe('s3File')
    expect(schema.type).toBe('object')

    const [assetField] = schema.fields as any[]
    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3FileAsset'},
    })

    const required = vi.fn(() => 'required-rule')
    expect((assetField.validation as (rule: any) => unknown)({required})).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)

    expect(schema.components.input).toBe(s3FileInput)

    const renderDefault = vi.fn(() => 'rendered-field')
    const result = (schema.components.field as (props: any) => unknown)({name: 'asset', renderDefault})
    expect(result).toBe('rendered-field')
    expect(renderDefault).toHaveBeenCalledWith({name: 'asset', renderDefault, level: 0})
  })
})
