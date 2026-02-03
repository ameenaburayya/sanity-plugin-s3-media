import {type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {type Reference} from 'sanity'

interface WithReferencedAssetProps<AssetDoc> {
  reference: Reference
  observeAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
  waitPlaceholder?: ReactNode
}

export function WithReferencedAsset<Asset>(props: WithReferencedAssetProps<Asset>): ReactNode {
  const {reference, children, observeAsset, waitPlaceholder} = props

  const documentId = reference?._ref
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset])
  const asset = useObservable(observable)

  return <>{documentId && asset ? children(asset) : waitPlaceholder}</>
}
