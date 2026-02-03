import groq from 'groq'

import type {S3AssetType} from '../../types'

export const constructFilter = ({
  assetTypes,
  searchQuery,
}: {
  assetTypes: S3AssetType[]
  searchQuery?: string
}): string => {
  // Fetch asset types depending on current context.
  // Either limit to a specific type (if being used as a custom asset source) or fetch both files and images (if being used as a tool)
  // Sanity will crash if you try and insert incompatible asset types into fields!
  const documentAssetTypes = assetTypes.map((type) => `${type}Asset`)

  const baseFilter = groq`
    _type in ${JSON.stringify(documentAssetTypes)} && !(_id in path("drafts.**"))
  `

  // Join separate filter fragments
  const constructedQuery = [
    // Base filter
    baseFilter,
    // Search query (if present)
    // NOTE: Currently this only searches direct fields on sanity.fileAsset/sanity.imageAsset and NOT referenced tags
    // It's possible to add this by adding the following line to the searchQuery, but it's quite slow
    // references(*[_type == "media.tag" && name.current == "${searchQuery.trim()}"]._id)
    ...(searchQuery
      ? [
          groq`[_id, altText, assetId, creditLine, description, originalFilename, title, url] match '*${searchQuery.trim()}*'`,
        ]
      : []),
  ].join(' && ')

  return constructedQuery
}
