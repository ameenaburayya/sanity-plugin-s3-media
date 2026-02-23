import {resolveUploaderBySchemaType} from '../resolveUploader'

const isTypeMock = vi.hoisted(() => vi.fn())

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    _isType: isTypeMock,
  }
})

describe('resolveUploaderBySchemaType', () => {
  const imageSchemaType = {
    name: 'mediaField',
    options: {accept: 'image/png'},
  } as any

  it('returns the first uploader matching schema type and accept rules', () => {
    const file = {name: 'photo.png', type: 'image/png'} as any

    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image')

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader?.schemaTypeName).toBe('s3Image')
    expect(uploader?.accept).toBe('image/*')
  })

  it('returns null when schema type does not match any uploader', () => {
    const file = {name: 'photo.png', type: 'image/png'} as any
    isTypeMock.mockReturnValue(false)

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader).toBeNull()
  })

  it('returns null when schema accepts rules reject the file', () => {
    const file = {name: 'photo.webp', type: 'image/webp'} as any

    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image')

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader).toBeNull()
  })

  it('falls back to empty schema accept string when schema options are missing', () => {
    const file = {name: 'archive.zip', type: 'application/zip'} as any

    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3File')

    const uploader = resolveUploaderBySchemaType({name: 'fieldWithoutOptions'} as any, file)

    expect(uploader?.schemaTypeName).toBe('s3File')
    expect(uploader?.accept).toBe('')
  })

  it('matches the video uploader and enforces video accept rules', () => {
    const file = {name: 'clip.mp4', type: 'video/mp4'} as any

    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Video')

    const uploader = resolveUploaderBySchemaType({name: 'videoField'} as any, file)

    expect(uploader?.schemaTypeName).toBe('s3Video')
    expect(uploader?.accept).toBe('video/*')
  })
})
