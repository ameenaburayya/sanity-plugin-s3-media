import type {FileLike, SchemaType} from 'sanity'
import type {Mock} from 'vitest'

import {resolveUploaderBySchemaType} from '../resolveUploader'

type SanityTypeMock = {
  _isType: Mock
}

const { _isType: isTypeMock } = (globalThis as {__sanityMock: SanityTypeMock}).__sanityMock

describe('resolveUploaderBySchemaType', () => {
  const imageSchemaType = {
    name: 'mediaField',
    options: {accept: 'image/png'},
  } as unknown as SchemaType

  it('returns the first uploader matching schema type and accept rules', () => {
    const file: FileLike = new File(['image'], 'photo.png', {type: 'image/png'})

    isTypeMock.mockImplementation(
      (_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image',
    )

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader?.schemaTypeName).toBe('s3Image')
    expect(uploader?.accept).toBe('image/*')
  })

  it('returns null when schema type does not match any uploader', () => {
    const file: FileLike = new File(['image'], 'photo.png', {type: 'image/png'})

    isTypeMock.mockReturnValue(false)

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader).toBeNull()
  })

  it('returns null when schema accepts rules reject the file', () => {
    const file: FileLike = new File(['image'], 'photo.webp', {type: 'image/webp'})

    isTypeMock.mockImplementation(
      (_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Image',
    )

    const uploader = resolveUploaderBySchemaType(imageSchemaType, file)

    expect(uploader).toBeNull()
  })

  it('falls back to empty schema accept string when schema options are missing', () => {
    const file: FileLike = new File(['archive'], 'archive.zip', {type: 'application/zip'})

    isTypeMock.mockImplementation(
      (_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3File',
    )

    const uploader = resolveUploaderBySchemaType(
      {name: 'fieldWithoutOptions'} as unknown as SchemaType,
      file,
    )

    expect(uploader?.schemaTypeName).toBe('s3File')
    expect(uploader?.accept).toBe('')
  })

  it('matches the video uploader and enforces video accept rules', () => {
    const file: FileLike = new File(['video'], 'clip.mp4', {type: 'video/mp4'})

    isTypeMock.mockImplementation(
      (_schema: unknown, schemaTypeName: string) => schemaTypeName === 's3Video',
    )

    const uploader = resolveUploaderBySchemaType({name: 'videoField'} as unknown as SchemaType, file)

    expect(uploader?.schemaTypeName).toBe('s3Video')
    expect(uploader?.accept).toBe('video/*')
  })
})
