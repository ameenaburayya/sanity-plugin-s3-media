import type {MutationEvent} from '@sanity/client'
import {Box, Button, Card, Flex, Heading, Text} from '@sanity/ui'
import groq from 'groq'
import {type FC, type PropsWithChildren, useCallback, useEffect, useState} from 'react'
import {useDispatch} from 'react-redux'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useClient,
  useColorSchemeValue,
  useDocumentStore,
  WithReferringDocuments,
} from 'sanity'

import {useTypedSelector} from '../../../hooks'
import {S3AssetType, type S3Asset} from '../../../types'
import {isS3FileAsset, isS3ImageAsset, getUniqueDocuments} from '../../../utils'
import {AssetMetadata} from '../AssetMetadata'
import {Dialog} from '../Dialog'
import {DocumentList} from '../DocumentList'
import {FileAssetPreview} from '../FileAssetPreview'
import {Image} from '../Image'
import {selectAssetById, dialogActions} from '../../../modules'
import type {DialogAssetEditProps} from '../../../types/browser'
import {useS3MediaContext} from '../../../contexts'

export const DialogAssetEdit: FC<PropsWithChildren<{dialog: DialogAssetEditProps}>> = (props) => {
  const {
    children,
    dialog: {assetId, id},
  } = props

  const sanityClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const scheme = useColorSchemeValue()

  const documentStore = useDocumentStore()

  const {buildAssetUrl} = useS3MediaContext()

  const dispatch = useDispatch()
  const assetItem = useTypedSelector((state) => selectAssetById(state, String(assetId))) // TODO: check casting

  // Generate a snapshot of the current asset
  const [assetSnapshot, setAssetSnapshot] = useState(assetItem?.asset)

  const currentAsset = assetItem ? assetItem?.asset : assetSnapshot

  const formUpdating = !assetItem || assetItem?.updating

  const handleClose = useCallback(() => {
    dispatch(dialogActions.remove({id}))
  }, [dispatch, id])

  const handleDelete = useCallback(() => {
    if (!assetItem?.asset) {
      return
    }

    dispatch(
      dialogActions.showConfirmDeleteAssets({
        assets: [assetItem],
        closeDialogId: assetItem?.asset._id,
      })
    )
  }, [assetItem, dispatch])

  const handleAssetUpdate = useCallback((update: MutationEvent) => {
    const {result, transition} = update
    if (result && transition === 'update') {
      // Regenerate asset snapshot
      setAssetSnapshot(result as S3Asset)
    }
  }, [])

  // Listen for asset mutations and update snapshot
  useEffect(() => {
    if (!assetItem?.asset) {
      return undefined
    }

    // Remember that Sanity listeners ignore joins, order clauses and projections
    const subscriptionAsset = sanityClient
      .listen(groq`*[_id == $id]`, {id: assetItem?.asset._id})
      .subscribe(handleAssetUpdate)

    return () => {
      subscriptionAsset?.unsubscribe()
    }
  }, [assetItem?.asset, sanityClient, handleAssetUpdate])

  if (!currentAsset) {
    return null
  }

  return (
    <Dialog
      animate
      footer={
        <Box padding={3}>
          <Flex justify="space-between">
            {/* Delete button */}
            <Button
              disabled={formUpdating}
              fontSize={1}
              mode="bleed"
              onClick={handleDelete}
              text="Delete"
              tone="critical"
            />
          </Flex>
        </Box>
      }
      header="Asset details"
      id={id}
      onClose={handleClose}
      width={3}
    >
      {/*
        We reverse direction to ensure the download button doesn't appear (in the DOM) before other tabbable items.
        This ensures that the dialog doesn't scroll down to the download button (which on smaller screens, can sometimes
        be below the fold).
      */}
      <Flex direction={['column-reverse', 'column-reverse', 'row-reverse']}>
        <Box flex={1} marginTop={[5, 5, 0]} padding={4}>
          <WithReferringDocuments documentStore={documentStore} id={currentAsset._id}>
            {({isLoading, referringDocuments}) => {
              const uniqueReferringDocuments = getUniqueDocuments(referringDocuments)
              return (
                <>
                  <Heading>
                    References
                    {!isLoading && Array.isArray(uniqueReferringDocuments)
                      ? ` (${uniqueReferringDocuments.length})`
                      : ''}
                  </Heading>

                  {/* Deleted notification */}
                  {!assetItem && (
                    <Card marginBottom={3} padding={3} radius={2} shadow={1} tone="critical">
                      <Text size={1}>This file cannot be found – it may have been deleted.</Text>
                    </Card>
                  )}

                  <Box marginTop={5}>
                    {assetItem?.asset && (
                      <DocumentList documents={uniqueReferringDocuments} isLoading={isLoading} />
                    )}
                  </Box>
                </>
              )
            }}
          </WithReferringDocuments>
        </Box>

        <Box flex={1} padding={4}>
          <Box style={{aspectRatio: '1'}}>
            {/* File */}
            {isS3FileAsset(currentAsset) && <FileAssetPreview asset={currentAsset} />}

            {/* Image */}
            {isS3ImageAsset(currentAsset) && (
              <Image
                draggable={false}
                $scheme={scheme}
                src={buildAssetUrl({assetId: currentAsset._id, assetType: S3AssetType.IMAGE})}
              />
            )}
          </Box>

          {/* Metadata */}
          {currentAsset && (
            <Box marginTop={4}>
              <AssetMetadata asset={currentAsset} item={assetItem} />
            </Box>
          )}
        </Box>
      </Flex>

      {children}
    </Dialog>
  )
}
