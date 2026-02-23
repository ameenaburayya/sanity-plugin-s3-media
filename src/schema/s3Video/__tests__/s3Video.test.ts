import {S3FileInput} from '../../s3File/components'
import {s3Video} from '..'

const defineTypeMock = vi.hoisted(() => vi.fn((schema) => schema))
const defineFieldMock = vi.hoisted(() => vi.fn((field) => field))

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    defineType: defineTypeMock,
    defineField: defineFieldMock,
  }
})

describe('s3Video schema', () => {
  it('defines object schema with required video reference', () => {
    const schema = s3Video as any
    expect(schema.name).toBe('s3Video')
    expect(schema.type).toBe('object')

    const [assetField] = schema.fields as any[]
    expect(assetField).toMatchObject({
      name: 'asset',
      type: 'reference',
      to: {type: 's3VideoAsset'},
    })

    const required = vi.fn(() => 'required-rule')
    expect((assetField.validation as (rule: any) => unknown)({required})).toBe('required-rule')
    expect(required).toHaveBeenCalledTimes(1)

    expect(schema.components.input).toBe(S3FileInput)

    const renderDefault = vi.fn(() => 'rendered-field')
    const result = (schema.components.field as (props: any) => unknown)({name: 'asset', renderDefault})
    expect(result).toBe('rendered-field')
    expect(renderDefault).toHaveBeenCalledWith({name: 'asset', renderDefault, level: 0})
  })
})
