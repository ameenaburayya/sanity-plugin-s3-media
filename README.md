# sanity-plugin-s3-media

Sanity Studio plugin that adds an S3-backed media browser, asset sources, and
schema types for files and images stored in AWS S3.

## Features

- Media tool in Studio for browsing, searching, and managing S3 assets.
- Asset sources for `s3Image` and `s3File` inputs.
- Direct uploads to S3 via a signed URL endpoint.
- Optional CloudFront domain for delivery URLs.
- Utilities to build S3 asset URLs from document IDs.

## Install

```sh
npm install sanity-plugin-s3-media
```

## Setup

### 1) Add the plugin

```ts
import {defineConfig} from 'sanity'
import {s3Media} from 'sanity-plugin-s3-media'

export default defineConfig({
  plugins: [
    s3Media({
      directUploads: true,
      maxSize: 50 * 1024 * 1024,
    }),
  ],
})
```

Plugin options:

- `directUploads` (default `true`): enable/disable direct S3 uploads.
- `maxSize` (bytes): maximum upload size enforced by the dropzone.

### 2) Add schema types

This plugin provides `s3Image` and `s3File` object types that reference
`s3ImageAsset` and `s3FileAsset` documents. Use them like any other field:

```ts
import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImage',
      type: 's3Image',
      options: {
        storeOriginalFilename: true,
      },
    }),
    defineField({
      name: 'datasheet',
      type: 's3File',
      options: {
        accept: 'application/pdf',
      },
    }),
  ],
})
```

Schema options:

- `accept`: file input accept string (e.g. `image/*`, `application/pdf`).
- `storeOriginalFilename` (default `true`): store original filename on the asset.

### 3) Configure credentials (Studio Secrets)

This plugin reads credentials from Sanity Studio Secrets under namespace
`s3MediaCredentials`. When required values are missing, the plugin opens a
credentials dialog in Studio.

Required keys:

- `bucketRegion`
- `bucketKey`
- `getSignedUrlEndpoint`
- `secret`

Optional keys:

- `deleteEndpoint`
- `cloudfrontDomain`

Security note: avoid hardcoding `secret` in code. Prefer Studio Secrets so it
does not end up in the Studio bundle.

## Endpoint contracts

### Signed URL endpoint (`getSignedUrlEndpoint`)

Request (POST JSON):

```json
{
  "secret": "<shared secret>",
  "fileName": "<file name>",
  "bucketKey": "<bucket key>",
  "bucketRegion": "<region>",
  "contentType": "<mime type>"
}
```

Response (JSON):

```json
{
  "url": "<signed upload url>"
}
```

### Delete endpoint (`deleteEndpoint`)

Request (POST JSON):

```json
{
  "fileKey": "<file name>",
  "secret": "<shared secret>",
  "bucketKey": "<bucket key>",
  "bucketRegion": "<region>"
}
```

Response: any 2xx status is treated as success.

## Utilities

The package also exports helpers for constructing asset URLs:

```ts
import {buildS3FileUrl, buildS3ImageUrl} from 'sanity-plugin-s3-media'

const fileUrl = buildS3FileUrl('s3File-<assetId>-<ext>', {baseUrl})
const imageUrl = buildS3ImageUrl('s3Image-<assetId>-<width>x<height>-<ext>', {baseUrl})
```

## Troubleshooting

- Credentials dialog keeps opening: verify all required keys are set in
  Studio Secrets (`s3MediaCredentials`).
- Uploads disabled: `directUploads` is `false` or missing required secrets.
- File too large: increase `maxSize` (bytes).
- CORS issues: ensure your S3 bucket and signed URL endpoint allow Studio origin.

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

## License

[MIT](LICENSE) © Ameen Aburayya

### Release new version

Run ["CI & Release" workflow](TODO/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
