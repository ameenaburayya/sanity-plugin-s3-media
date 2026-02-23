import {resolveUploaderBySchemaType} from '../resolveUploader'

const isTypeMock = vi.hoisted(() => vi.fn())
const acceptsMock = vi.hoisted(() => vi.fn())

vi.mock('sanity', () => ({
  _isType: isTypeMock,
}))

vi.mock('../../../utils', () => {
  return {
    accepts: acceptsMock,
    withMaxConcurrency: <A extends unknown[], R>(func: (...args: A) => R) => func,
    hashFile: vi.fn(),
    CLEANUP_EVENT: {type: 'cleanup'},
    createInitialUploadEvent: vi.fn(),
    createUploadEvent: vi.fn(),
  }
})

describe('resolveUploaderBySchemaType', () => {
  const schemaType = {
    name: 'mediaField',
    options: {accept: 'image/png'},
  } as any
  const file = {name: 'photo.png', type: 'image/png'} as any

  it('returns the first uploader matching schema type and accept rules', () => {
    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image')
    acceptsMock.mockReturnValue(true)

    const uploader = resolveUploaderBySchemaType(schemaType, file)

    expect(uploader?.schemaTypeName).toBe('s3Image')
    expect(acceptsMock).toHaveBeenNthCalledWith(1, file, 'image/*')
    expect(acceptsMock).toHaveBeenNthCalledWith(2, file, 'image/png')
  })

  it('returns null when schema type does not match any uploader', () => {
    isTypeMock.mockReturnValue(false)

    const uploader = resolveUploaderBySchemaType(schemaType, file)

    expect(uploader).toBeNull()
    expect(acceptsMock).not.toHaveBeenCalled()
  })

  it('returns null when schema accepts rules reject the file', () => {
    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image')
    acceptsMock.mockImplementation((_file: unknown, accept: string) => accept !== 'image/png')

    const uploader = resolveUploaderBySchemaType(schemaType, file)

    expect(uploader).toBeNull()
  })

  it('falls back to empty schema accept string when schema options are missing', () => {
    isTypeMock.mockImplementation((_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3File')
    acceptsMock.mockReturnValue(true)

    const uploader = resolveUploaderBySchemaType({name: 'fieldWithoutOptions'} as any, file)

    expect(uploader?.schemaTypeName).toBe('s3File')
    expect(acceptsMock).toHaveBeenNthCalledWith(1, file, '')
    expect(acceptsMock).toHaveBeenNthCalledWith(2, file, '')
  })
})
