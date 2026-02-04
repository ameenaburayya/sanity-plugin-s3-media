import {Box, Button, Card, Flex, Heading, Text} from '@sanity/ui'
import {type FC, type PropsWithChildren, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue, useDocumentStore, WithReferringDocuments} from 'sanity'

import {useS3MediaContext} from '../../../contexts'
import {useTypedSelector} from '../../../hooks'
import {dialogActions, selectAssetById} from '../../../modules'
import {S3AssetType} from '../../../types'
import type {DialogAssetEditProps} from '../../../types/browser'
import {getUniqueDocuments, isS3FileAsset, isS3ImageAsset} from '../../../utils'
import {AssetMetadata} from '../AssetMetadata'
import {Dialog} from '../Dialog'
import {DocumentList} from '../DocumentList'
import {FileAssetPreview} from '../FileAssetPreview'
import {Image} from '../Image'

export const DialogAssetEdit: FC<PropsWithChildren<{dialog: DialogAssetEditProps}>> = (props) => {
  const {
    children,
    dialog: {assetId, id},
  } = props

  const scheme = useColorSchemeValue()

  const documentStore = useDocumentStore()

  const {buildAssetUrl} = useS3MediaContext()

  const dispatch = useDispatch()
  const assetItem = useTypedSelector((state) => selectAssetById(state, String(assetId)))

  const currentAsset = assetItem ? assetItem?.asset : null

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
      }),
    )
  }, [assetItem, dispatch])

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
