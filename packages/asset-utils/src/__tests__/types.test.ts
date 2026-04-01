import type {S3ImageAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'
import {expectTypeOf} from 'vitest'

import type {
  Reference,
  S3AssetObjectStub,
  S3AssetSource,
  S3AssetStringSource,
  S3FileAssetIdParts,
  S3FileObjectStub,
  S3FileSource,
  S3ImageDimensions,
  S3ImageObjectStub,
  S3ImageSource,
  S3ImageUploadStub,
  S3UrlType,
  S3VideoDimensions,
  S3VideoObjectStub,
  S3VideoSource,
  S3VideoUploadStub,
  SafeFunction,
} from '../types'

describe('types', () => {
  it('has no runtime exports (type-only module)', async () => {
    const mod = await import('../types')

    expect(Object.keys(mod)).toHaveLength(0)
  })

  it('defines expected public type contracts', () => {
    expectTypeOf<Reference>().toMatchObjectType<{_ref: string; _weak?: boolean}>()
    expectTypeOf<S3AssetStringSource>().toEqualTypeOf<string>()
    expectTypeOf<S3FileAssetIdParts>().toMatchObjectType<{
      type: 's3File'
      assetId: string
      extension: string
    }>()
    expectTypeOf<S3AssetObjectStub>().toMatchTypeOf<
      S3FileObjectStub | S3ImageObjectStub | S3VideoObjectStub
    >()
    expectTypeOf<S3AssetSource>().toEqualTypeOf<S3ImageSource | S3VideoSource | S3FileSource>()
    expectTypeOf<S3ImageSource>().toMatchTypeOf<
      Reference | S3ImageAsset | S3ImageObjectStub | S3ImageUploadStub
    >()
    expectTypeOf<S3VideoSource>().toMatchTypeOf<
      Reference | S3VideoAsset | S3VideoObjectStub | S3VideoUploadStub
    >()
    expectTypeOf<S3ImageDimensions>().toMatchObjectType<{
      _type: 's3ImageDimensions'
      width: number
      height: number
      aspectRatio: number
    }>()
    expectTypeOf<S3VideoDimensions>().toMatchObjectType<{
      _type: 's3VideoDimensions'
      width: number
      height: number
      aspectRatio: number
    }>()
    expectTypeOf<S3UrlType>().toEqualTypeOf<'file' | 'image' | 'video'>()

    type StringToNumberSafe = SafeFunction<[string], number>
    expectTypeOf<StringToNumberSafe>().toExtend<(input: string) => number | undefined>()
  })
})
