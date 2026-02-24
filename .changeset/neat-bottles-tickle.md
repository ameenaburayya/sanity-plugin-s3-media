---
'sanity-plugin-s3-media': major
'sanity-plugin-s3-media-asset-utils': minor
---

Migrate to a pnpm workspace and remove `sanity-plugin-s3-media/asset-utils` in favor of a standalone utils package:

- `sanity-plugin-s3-media-asset-utils`

The `packages/types` workspace package is internal-only (`private`) and is not published.
`./client` remains unchanged for the plugin package.
