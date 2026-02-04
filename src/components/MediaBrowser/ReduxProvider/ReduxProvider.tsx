import {type AnyAction, configureStore, type Store} from '@reduxjs/toolkit'
import type {SanityClient} from '@sanity/client'
import {Component, type ReactNode} from 'react'
import {Provider} from 'react-redux'
import {createEpicMiddleware} from 'redux-observable'
import type {SanityDocument} from 'sanity'

import {SUPPORTED_ASSET_TYPES} from '../../../constants'
import type {S3Client} from '../../../lib'
import {initialState as assetsInitialState, rootEpic, rootReducer} from '../../../modules'
import type {RootReducerState, S3AssetSourceComponentProps} from '../../../types'
import {getDocumentAssetIds, isSupportedAssetType} from '../../../utils'

type Props = {
  assetType?: S3AssetSourceComponentProps['assetType']
  children?: ReactNode
  sanityClient: SanityClient
  s3Client: S3Client
  document?: SanityDocument
  selectedAssets?: S3AssetSourceComponentProps['selectedAssets']
}

export class ReduxProvider extends Component<Props> {
  store: Store

  constructor(props: Props) {
    super(props)

    // Initialize redux store + middleware
    const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, RootReducerState>({
      dependencies: {
        sanityClient: props.sanityClient,
        s3Client: props.s3Client,
      },
    })

    this.store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          thunk: false,
        }).prepend(epicMiddleware),
      preloadedState: {
        assets: {
          ...assetsInitialState,
          assetTypes: isSupportedAssetType(props?.assetType)
            ? [props.assetType]
            : SUPPORTED_ASSET_TYPES,
        },
        dialog: {items: []},
        notifications: {items: []},
        search: {query: ''},
        selected: {
          assets: props.selectedAssets || [],
          document: props.document,
          documentAssetIds: props.document ? getDocumentAssetIds(props.document) : [],
        },
        uploads: {
          allIds: [],
          byIds: {},
        },
      },
    })
    epicMiddleware.run(rootEpic)
  }

  override render() {
    return <Provider store={this.store}>{this.props.children}</Provider>
  }
}
