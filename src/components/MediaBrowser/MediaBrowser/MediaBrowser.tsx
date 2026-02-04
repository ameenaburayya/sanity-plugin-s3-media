import type {MutationEvent} from '@sanity/client'
import {Card, Flex, PortalProvider} from '@sanity/ui'
import groq from 'groq'
import {type FC, useEffect, useState} from 'react'
import {useDispatch} from 'react-redux'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, type SanityDocument, useClient} from 'sanity'

import {AssetBrowserDispatchProvider, useS3MediaContext} from '../../../contexts'
import {assetsActions} from '../../../modules'
import type {S3Asset, S3AssetSourceComponentProps} from '../../../types'
import {Controls} from '../Controls'
import {Dialogs} from '../Dialogs'
import {Header} from '../Header'
import {Items} from '../Items'
import {Notifications} from '../Notifications'
import {PickedBar} from '../PickedBar'
import {ReduxProvider} from '../ReduxProvider'
import {GlobalStyle} from '../styled/GlobalStyles'
import {UploadDropzone} from '../UploadDropzone'

type MediaBrowserProps = Partial<S3AssetSourceComponentProps> & {
  document?: SanityDocument
}

const MediaBrowserContent = ({onClose}: {onClose?: S3AssetSourceComponentProps['onClose']}) => {
  const sanityClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const handleAssetUpdate = (update: MutationEvent) => {
      const {documentId, result, transition} = update

      if (transition === 'appear') {
        dispatch(assetsActions.listenerCreateQueue({asset: result as S3Asset}))
      }

      if (transition === 'disappear') {
        dispatch(assetsActions.listenerDeleteQueue({assetId: documentId}))
      }

      if (transition === 'update') {
        dispatch(assetsActions.listenerUpdateQueue({asset: result as S3Asset}))
      }
    }

    // Fetch assets: first page
    dispatch(assetsActions.loadPageIndex({pageIndex: 0}))

    const subscriptionAsset = sanityClient
      .listen(groq`*[_type in ["s3FileAsset", "s3ImageAsset"] && !(_id in path("drafts.**"))]`)
      .subscribe(handleAssetUpdate)

    return () => {
      subscriptionAsset?.unsubscribe()
    }
  }, [sanityClient, dispatch])

  return (
    <PortalProvider element={portalElement}>
      <UploadDropzone>
        <Dialogs />
        <Notifications />

        <Card display="flex" height="fill" ref={setPortalElement}>
          <Flex direction="column" flex={1}>
            {/* Header */}
            <Header onClose={onClose} />

            {/* Browser Controls */}
            <Controls />

            <Flex flex={1}>
              <Flex align="flex-end" direction="column" flex={1} style={{position: 'relative'}}>
                <PickedBar />
                <Items />
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </UploadDropzone>
    </PortalProvider>
  )
}

export const MediaBrowser: FC<MediaBrowserProps> = (props) => {
  const {assetType, document, selectedAssets, onSelect, onClose} = props

  const sanityClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {s3Client} = useS3MediaContext()

  return (
    <ReduxProvider
      assetType={assetType}
      sanityClient={sanityClient}
      s3Client={s3Client}
      document={document}
      selectedAssets={selectedAssets}
    >
      <AssetBrowserDispatchProvider onSelect={onSelect}>
        <GlobalStyle />
        <MediaBrowserContent onClose={onClose} />
      </AssetBrowserDispatchProvider>
    </ReduxProvider>
  )
}
