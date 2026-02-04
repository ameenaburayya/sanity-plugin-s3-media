import {Box, Flex, Stack, Text, useGlobalKeyDown} from '@sanity/ui'
import {type FC, type MouseEvent, useCallback} from 'react'
import {isValidElementType} from 'react-is'

import type {S3AssetSource} from '../../types'
import {Button, Dialog} from '../UI'

interface UploadDestinationPickerProps {
  assetSources: S3AssetSource[]
  onSelectAssetSource?: (source: S3AssetSource | null) => void
  onClose?: () => void
  text?: string
}

export const UploadDestinationPicker: FC<UploadDestinationPickerProps> = (props) => {
  const {assetSources, onSelectAssetSource, text, onClose} = props

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const target = event.currentTarget as HTMLElement
      const sourceName = target.getAttribute('data-asset-source-name') as string
      const assetSource = assetSources.find((source) => source.name === sourceName)
      if (assetSource && onSelectAssetSource) {
        onSelectAssetSource(assetSource)
      }
    },
    [assetSources, onSelectAssetSource],
  )

  useGlobalKeyDown((event) => {
    if (event.key === 'Escape') {
      if (onClose) {
        onClose()
      }
    }
  })

  if (assetSourcesWithUpload.length === 0) {
    return null
  }

  return (
    <Dialog
      onClickOutside={onClose}
      onClose={onClose}
      id="upload-destination-picker"
      header={
        <Text size={1} textOverflow="ellipsis" weight="medium">
          {text}
        </Text>
      }
      width={1}
      bodyHeight="stretch"
    >
      <Box padding={2}>
        <Stack space={2}>
          {assetSourcesWithUpload.map((assetSource) => {
            const Icon = assetSource.icon
            return (
              <Button
                key={assetSource.name}
                data-asset-source-name={assetSource.name}
                mode="bleed"
                onClick={handleClick}
                tone="default"
                tooltipProps={null}
              >
                <Flex align="center">
                  {isValidElementType(Icon) && <Icon style={{fontSize: '2rem'}} />}
                  <Box>
                    <Text>{assetSource.title}</Text>
                  </Box>
                </Flex>
              </Button>
            )
          })}
        </Stack>
      </Box>
    </Dialog>
  )
}
