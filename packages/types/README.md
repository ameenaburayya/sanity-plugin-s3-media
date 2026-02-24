# sanity-plugin-s3-media-types

Internal, workspace-only type definitions for the [`sanity-plugin-s3-media`](https://github.com/ameenaburayya/sanity-plugin-s3-media) monorepo. This package is **not published to npm** — it exists to share TypeScript interfaces between the Studio plugin and the [`sanity-plugin-s3-media-asset-utils`](../asset-utils) package without duplicating code.

## What's inside

- **Asset document types** — `S3ImageAsset`, `S3FileAsset`, `S3VideoAsset`, and their ID-part interfaces.
- **Schema object types** — stubs, sources, upload placeholders, and metadata shapes used by the plugin's custom schema fields.
- **`S3AssetType` enum** — the canonical `s3Image` / `s3File` / `s3Video` discriminator.

## For consumers

This package is marked `private` and should never be installed directly. If you need asset types or utilities in your own code, use one of the published packages instead:

| Package                                                                                                  | Install                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`sanity-plugin-s3-media`](https://www.npmjs.com/package/sanity-plugin-s3-media)                         | `npm install sanity-plugin-s3-media`             |
| [`sanity-plugin-s3-media-asset-utils`](https://www.npmjs.com/package/sanity-plugin-s3-media-asset-utils) | `npm install sanity-plugin-s3-media-asset-utils` |

## License

[MIT](../../LICENSE) &copy; Ameen Aburayya
