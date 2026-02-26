# sanity-plugin-s3-media-asset-utils

Standalone utility helpers for building URLs and parsing asset IDs used by [`sanity-plugin-s3-media`](https://github.com/ameenaburayya/sanity-plugin-s3-media). Use them in frontends, serverless functions, or anywhere you need to resolve S3 asset URLs — no Studio dependency at runtime.

This package is part of the [`sanity-plugin-s3-media`](https://github.com/ameenaburayya/sanity-plugin-s3-media) monorepo.

## Install

```sh
npm install sanity-plugin-s3-media-asset-utils
```

## URL builders

Build full URLs or bare paths from asset document IDs.

```ts
import {
  buildS3FileUrl,
  buildS3ImageUrl,
  buildS3VideoUrl,
  buildS3FilePath,
  buildS3ImagePath,
  buildS3VideoPath,
} from 'sanity-plugin-s3-media-asset-utils'

const baseUrl = 'https://cdn.example.com'

// Full URLs
buildS3FileUrl('s3File-abc123-pdf', {baseUrl})
// → "https://cdn.example.com/abc123.pdf"

buildS3ImageUrl('s3Image-abc123-1920x1080-jpg', {baseUrl})
// → "https://cdn.example.com/abc123-1920x1080.jpg"

buildS3VideoUrl('s3Video-abc123-1920x1080-mp4', {baseUrl})
// → "https://cdn.example.com/abc123-1920x1080.mp4"

// Bare paths (no base URL)
buildS3FilePath('s3File-abc123-pdf')
// → "abc123.pdf"
```

## ID parsers

Decompose an asset document ID into its constituent parts.

```ts
import {
  parseS3AssetId,
  parseS3AssetFilename,
  parseS3AssetUrl,
  parseS3FileAssetId,
  parseS3ImageAssetId,
  parseS3VideoAssetId,
} from 'sanity-plugin-s3-media-asset-utils'

parseS3FileAssetId('s3File-abc123-pdf')
// → { type: 's3File', assetId: 'abc123', extension: 'pdf' }

parseS3ImageAssetId('s3Image-abc123-1920x1080-jpg')
// → { type: 's3Image', assetId: 'abc123', width: 1920, height: 1080, extension: 'jpg' }

parseS3VideoAssetId('s3Video-abc123-1920x1080-mp4')
// → { type: 's3Video', assetId: 'abc123', width: 1920, height: 1080, extension: 'mp4' }

parseS3AssetId('s3File-abc123-pdf')
// → { type: 's3File', assetId: 'abc123', extension: 'pdf' }

parseS3AssetFilename('abc123-1920x1080.mp4')
// → { type: 's3Video', assetId: 'abc123', width: 1920, height: 1080, extension: 'mp4' }

parseS3AssetUrl('https://cdn.example.com/assets/abc123-1920x1080.mp4')
// → { type: 's3Video', assetId: 'abc123', width: 1920, height: 1080, extension: 'mp4' }
```

## Resolution helpers

Resolve asset metadata from any source shape — document IDs, references, asset stubs, or full asset objects.

```ts
import {
  getS3IdFromString,
  getS3AssetDocumentId,
  getS3AssetExtension,
  getS3ImageDimensions,
  getS3VideoDimensions,
  getS3ImageDimensionsFromSource,
  getS3VideoDimensionsFromSource,
} from 'sanity-plugin-s3-media-asset-utils'

// Resolve document ID from a reference, asset stub, or asset object
getS3AssetDocumentId({_ref: 's3Image-abc123-1920x1080-jpg'})
// → "s3Image-abc123-1920x1080-jpg"

// Get file extension
getS3AssetExtension({_ref: 's3File-abc123-pdf'})
// → "pdf"

// Get image dimensions with aspect ratio
getS3ImageDimensions({_ref: 's3Image-abc123-1920x1080-jpg'})
// → { width: 1920, height: 1080, aspectRatio: 1.777..., _type: 's3ImageDimensions' }

// Get plain width/height (no metadata wrapper)
getS3ImageDimensionsFromSource({_ref: 's3Image-abc123-1920x1080-jpg'})
// → { width: 1920, height: 1080 }

getS3IdFromString('https://cdn.example.com/assets/abc123.pdf')
// → "s3File-abc123-pdf"
```

### Safe variants

Each throwing resolver has a `try*` counterpart that returns `undefined` instead of throwing when the source cannot be resolved:

```ts
import {
  tryGetS3IdFromString,
  tryGetS3AssetDocumentId,
  tryGetS3AssetExtension,
  tryGetS3ImageDimensions,
  tryGetS3VideoDimensions,
} from 'sanity-plugin-s3-media-asset-utils'

tryGetS3AssetExtension(unknownValue) // string | undefined
tryGetS3ImageDimensions(unknownValue) // S3ImageDimensions | undefined
tryGetS3VideoDimensions(unknownValue) // S3VideoDimensions | undefined
tryGetS3IdFromString(unknownValue) // string | undefined
tryGetS3AssetDocumentId(unknownValue) // string | undefined
```

## Type guards

Narrow unknown values to specific S3 asset types.

```ts
import {
  isReference,
  isS3AssetId,
  isS3FileAsset,
  isS3ImageAsset,
  isS3VideoAsset,
  isS3FileUrl,
  isS3ImageUrl,
  isS3VideoUrl,
  isS3FileSource,
  isS3ImageSource,
  isS3VideoSource,
  isS3AssetObjectStub,
  isInProgressUpload,
  isUnresolvableError,
} from 'sanity-plugin-s3-media-asset-utils'
```

## Types

All asset-related TypeScript types are re-exported for convenience:

```ts
import type {
  S3Asset,
  S3AssetDocument,
  S3FileAsset,
  S3FileAssetIdParts,
  S3FileSource,
  S3ImageAsset,
  S3ImageAssetIdParts,
  S3ImageDimensions,
  S3ImageSource,
  S3VideoAsset,
  S3VideoAssetIdParts,
  S3VideoDimensions,
  S3VideoSource,
  S3AssetType,
} from 'sanity-plugin-s3-media-asset-utils'
```

## Runtime note

This package does **not** import `sanity` at runtime. It lists `sanity` as a peer dependency only for its type definitions.

## License

[MIT](../../LICENSE) &copy; Ameen Aburayya
