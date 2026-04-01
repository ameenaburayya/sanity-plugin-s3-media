import type {SanityClient, SanityDocument} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {useSelector} from 'react-redux'
import {type Observable} from 'rxjs'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {SUPPORTED_ASSET_TYPES} from 'src/constants'
import type {S3Client} from 'src/lib'
import type {RootReducerState} from 'src/types'
import {mockS3ImageAsset} from 'test/fixtures'

import {ReduxProvider} from '../ReduxProvider'

const sanityClient = {
  observable: {
    delete: () => ({pipe: () => undefined}) as unknown as Observable<SanityDocument[]>,
    fetch: () => ({pipe: () => undefined}) as unknown as Observable<SanityDocument[]>,
  },
} as unknown as SanityClient

const s3Client = {
  observable: {
    assets: {
      deleteAsset: () => ({pipe: () => undefined}) as unknown as Observable<void>,
    },
  },
} as unknown as S3Client

const StateProbe = () => {
  const assetTypes = useSelector((state: RootReducerState) => state.assets.assetTypes)
  const selectedAssets = useSelector((state: RootReducerState) => state.selected.assets)
  const documentAssetIds = useSelector((state: RootReducerState) => state.selected.documentAssetIds)

  return (
    <div>
      <div data-testid="asset-types">{assetTypes.join(',')}</div>
      <div data-testid="selected-assets">{selectedAssets.length}</div>
      <div data-testid="document-asset-ids">{documentAssetIds?.join(',')}</div>
    </div>
  )
}

describe('ReduxProvider', () => {
  it('renders children inside the provider', () => {
    render(
      <ReduxProvider sanityClient={sanityClient} s3Client={s3Client}>
        <div>Provider child</div>
      </ReduxProvider>,
    )

    expect(screen.getByText('Provider child')).toBeInTheDocument()
  })

  it('uses a single provided supported assetType and selected assets', () => {
    render(
      <ReduxProvider
        assetType={S3AssetType.IMAGE}
        sanityClient={sanityClient}
        s3Client={s3Client}
        selectedAssets={[mockS3ImageAsset]}
      >
        <StateProbe />
      </ReduxProvider>,
    )

    expect(screen.getByTestId('asset-types')).toHaveTextContent(S3AssetType.IMAGE)
    expect(screen.getByTestId('selected-assets')).toHaveTextContent('1')
  })

  it('falls back to supported asset types and derives document references', () => {
    const document = {
      _id: 'doc-1',
      _type: 'post',
      body: [
        {
          asset: {
            _ref: 'asset-b',
            _type: 'reference',
          },
        },
        {
          nested: {
            asset: {
              _ref: 'asset-a',
              _type: 'reference',
            },
          },
        },
      ],
      hero: {
        asset: {
          _ref: 'asset-a',
          _type: 'reference',
        },
      },
    }

    render(
      <ReduxProvider
        assetType={'unsupported' as S3AssetType}
        document={document as unknown as SanityDocument}
        sanityClient={sanityClient}
        s3Client={s3Client}
      >
        <StateProbe />
      </ReduxProvider>,
    )

    expect(screen.getByTestId('asset-types')).toHaveTextContent(SUPPORTED_ASSET_TYPES.join(','))
    expect(screen.getByTestId('document-asset-ids')).toHaveTextContent('asset-a,asset-b')
  })
})
