import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Stack, Text} from '@sanity/ui'
import {filesize} from 'filesize'
import {type FC, type ReactNode} from 'react'

import {useS3MediaContext} from '../../../contexts'
import {type AssetItem, type S3Asset, S3AssetType} from '../../../types'
import {downloadAsset, getAssetResolution, isS3ImageAsset, isS3VideoAsset} from '../../../utils'
import {ButtonAssetCopy} from '../ButtonAssetCopy'

type AssetMetadataProps = {
  asset: S3Asset
  item?: AssetItem
}

const Row = ({label, value}: {label: string; value: ReactNode}) => {
  return (
    <Flex justify="space-between">
      <Text
        size={1}
        style={{
          opacity: 0.8,
          width: '40%',
        }}
        textOverflow="ellipsis"
      >
        {label}
      </Text>
      <Text
        size={1}
        style={{
          opacity: 0.4,
          textAlign: 'right',
          width: '60%',
        }}
        textOverflow="ellipsis"
      >
        {value}
      </Text>
    </Flex>
  )
}

export const AssetMetadata: FC<AssetMetadataProps> = (props) => {
  const {asset, item} = props

  const {buildAssetUrl} = useS3MediaContext()

  const assetUrl = buildAssetUrl({
    assetType: isS3ImageAsset(asset)
      ? S3AssetType.IMAGE
      : isS3VideoAsset(asset)
        ? S3AssetType.VIDEO
        : S3AssetType.FILE,
    assetId: asset._id,
  })

  return (
    <Box marginTop={3}>
      {/* Base */}
      <Box>
        <Stack space={3}>
          <Row label="Size" value={filesize(asset?.size, {base: 10, round: 0})} />
          <Row label="MIME type" value={asset?.mimeType} />
          <Row label="Extension" value={asset.extension.toUpperCase()} />
          {(isS3ImageAsset(asset) || isS3VideoAsset(asset)) && (
            <Row label="Dimensions" value={getAssetResolution(asset)} />
          )}
        </Stack>
      </Box>

      {/* Asset actions */}
      <Box marginTop={5}>
        <Inline space={2}>
          {/* Download */}
          <Button
            disabled={!item || item?.updating}
            fontSize={1}
            icon={DownloadIcon}
            mode="ghost"
            onClick={() => downloadAsset(assetUrl)}
            text="Download"
          />
          {/* Copy to clipboard */}
          <ButtonAssetCopy disabled={!item || item?.updating} url={assetUrl} />
        </Inline>
      </Box>
    </Box>
  )
}
