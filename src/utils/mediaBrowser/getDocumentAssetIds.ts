import type {SanityDocument} from '@sanity/client'
import {isReference} from 'sanity-plugin-s3-media-asset-utils'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[]

const isPlainObject = (value: unknown): value is Record<string, JsonValue> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)


// Recursively search node for any linked asset ids (`asset._type === 'reference'`)
const getAssetIds = (node: JsonValue, acc: string[] = []) => {
  if (Array.isArray(node)) {
    node.forEach((v) => {
      getAssetIds(v, acc)
    })
  }

  if (isPlainObject(node)) {
    const asset = isPlainObject(node.asset) ? (node.asset as Record<string, JsonValue>) : undefined

    if (asset && isReference(asset)) {
      acc.push(asset._ref)
    }

    Object.values(node).forEach((val) => {
      getAssetIds(val, acc)
    })
  }

  return acc
}

// Retrieve all linked asset ids from a Sanity document
export const getDocumentAssetIds = (document: SanityDocument): string[] => {
  const assetIds = getAssetIds(document)

  // Sort and dedupe
  return [...new Set(assetIds.sort())]
}
