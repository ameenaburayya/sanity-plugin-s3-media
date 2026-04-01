import {expectTypeOf} from 'vitest'

import type {
  Reference,
  S3AssetObjectStub,
  S3AssetSource,
  S3AssetStringSource,
  S3FileAssetIdParts,
  S3FileSource,
  S3ImageDimensions,
  S3ImageSource,
  S3UrlType,
  S3VideoDimensions,
  S3VideoSource,
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
    expectTypeOf<S3AssetObjectStub>().toMatchObjectType<{asset: unknown}>()
    expectTypeOf<S3AssetSource>().toEqualTypeOf<S3ImageSource | S3VideoSource | S3FileSource>()
    expectTypeOf<S3ImageSource>().toExtend<Reference | {asset?: unknown}>()
    expectTypeOf<S3VideoSource>().toExtend<Reference | {asset?: unknown}>()
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
