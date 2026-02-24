# sanity-plugin-s3-media

A [Sanity Studio](https://www.sanity.io/) plugin that replaces the default asset pipeline with your own AWS S3 bucket. Browse, search, upload, and manage images, files, and videos directly from Studio — all stored in S3 and optionally served through CloudFront.

## Features

- **Media browser** — a dedicated Studio tool for browsing, searching, and managing all your S3 assets in one place.
- **Custom asset sources** — drop-in `s3Image`, `s3File`, and `s3Video` schema types that work just like native Sanity fields.
- **Direct uploads** — files go straight to S3 via a signed URL endpoint, no intermediate server required.
- **CloudFront support** — optionally serve assets through a CloudFront distribution for faster delivery.
- **Asset utilities** — companion package [`sanity-plugin-s3-media-asset-utils`](./packages/asset-utils) for building URLs and parsing asset IDs outside the Studio.

## Packages

This project ships two npm packages:

| Package                                                                          | Description                                                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`sanity-plugin-s3-media`](https://www.npmjs.com/package/sanity-plugin-s3-media) | The Studio plugin — media browser, asset sources, and schema types.                                                            |
| [`sanity-plugin-s3-media-asset-utils`](./packages/asset-utils)                   | Standalone utility helpers for building S3 asset URLs and parsing asset IDs. Works anywhere — no Studio dependency at runtime. |

## Install

```sh
npm install sanity-plugin-s3-media
```

## Setup

### 1. Register the plugin

```ts
// sanity.config.ts
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

| Option          | Default | Description                                            |
| --------------- | ------- | ------------------------------------------------------ |
| `directUploads` | `true`  | Enable or disable direct S3 uploads from Studio.       |
| `maxSize`       | —       | Maximum upload size in bytes enforced by the dropzone. |

### 2. Use the schema types

The plugin registers three object types — `s3Image`, `s3File`, and `s3Video` — that reference their corresponding asset documents (`s3ImageAsset`, `s3FileAsset`, `s3VideoAsset`). Use them like any other Sanity field:

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
    defineField({
      name: 'promoVideo',
      type: 's3Video',
    }),
  ],
})
```

| Option                  | Default | Description                                                   |
| ----------------------- | ------- | ------------------------------------------------------------- |
| `accept`                | —       | File input accept string (e.g. `image/*`, `application/pdf`). |
| `storeOriginalFilename` | `true`  | Persist the original filename on the asset document.          |

### 3. Configure credentials

Credentials are stored through [Sanity Studio Secrets](https://github.com/sanity-io/sanity-studio-secrets) under the namespace `s3MediaCredentials`. When any required value is missing, the plugin automatically opens a credentials dialog in Studio.

| Key                    | Required | Description                                   |
| ---------------------- | -------- | --------------------------------------------- |
| `bucketRegion`         | Yes      | AWS region of your S3 bucket.                 |
| `bucketKey`            | Yes      | The S3 bucket name / key.                     |
| `getSignedUrlEndpoint` | Yes      | URL of your signed-URL endpoint (see below).  |
| `secret`               | Yes      | Shared secret sent to your endpoint for auth. |
| `deleteEndpoint`       | No       | URL of your delete endpoint (see below).      |
| `cloudfrontDomain`     | No       | CloudFront domain for asset delivery URLs.    |

> Avoid hardcoding `secret` in source code. Studio Secrets keeps it out of the Studio bundle.

## Endpoint contracts

You need to provide your own backend endpoints for signing upload URLs and (optionally) deleting assets.

### Signed URL endpoint

**POST** to `getSignedUrlEndpoint`:

```json
{
  "secret": "<shared secret>",
  "fileName": "<file name>",
  "bucketKey": "<bucket key>",
  "bucketRegion": "<region>",
  "contentType": "<mime type>"
}
```

**Response:**

```json
{
  "url": "<presigned S3 upload URL>"
}
```

### Delete endpoint

**POST** to `deleteEndpoint`:

```json
{
  "fileKey": "<file name>",
  "secret": "<shared secret>",
  "bucketKey": "<bucket key>",
  "bucketRegion": "<region>"
}
```

**Response:** any `2xx` status is treated as success.

## Asset utilities

URL-building and ID-parsing helpers live in a dedicated package so you can use them in frontends, serverless functions, or anywhere else without pulling in the full Studio plugin:

```sh
npm install sanity-plugin-s3-media-asset-utils
```

```ts
import {buildS3FileUrl, buildS3ImageUrl, buildS3VideoUrl} from 'sanity-plugin-s3-media-asset-utils'

const baseUrl = 'https://cdn.example.com'

const fileUrl = buildS3FileUrl('s3File-abc123-pdf', {baseUrl})
const imageUrl = buildS3ImageUrl('s3Image-abc123-1920x1080-jpg', {baseUrl})
const videoUrl = buildS3VideoUrl('s3Video-abc123-1920x1080-mp4', {baseUrl})
```

See the [asset-utils README](./packages/asset-utils) for the full API reference.

## Troubleshooting

| Symptom                          | Fix                                                                        |
| -------------------------------- | -------------------------------------------------------------------------- |
| Credentials dialog keeps opening | Verify all required keys are set in Studio Secrets (`s3MediaCredentials`). |
| Uploads are disabled             | Set `directUploads: true` and ensure all required secrets are present.     |
| File too large                   | Increase the `maxSize` option (in bytes).                                  |
| CORS errors                      | Ensure your S3 bucket and signed-URL endpoint allow your Studio's origin.  |

## Development

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit) with default configuration for build and watch scripts. See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio) for hot-reload setup.

```sh
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build:all

# Lint
pnpm lint
```

## License

[MIT](LICENSE) &copy; Ameen Aburayya
