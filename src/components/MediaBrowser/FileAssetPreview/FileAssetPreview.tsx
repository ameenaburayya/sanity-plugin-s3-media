import {Flex} from '@sanity/ui'
import type {FC} from 'react'

import {S3AssetType, type S3Asset} from '../../../types'
import {FileIcon} from '../FileIcon'
import {useS3MediaContext} from '../../../contexts'

type FileAssetPreviewProps = {
  asset: S3Asset
}

export const FileAssetPreview: FC<FileAssetPreviewProps> = (props) => {
  const {asset} = props

  const {buildAssetUrl} = useS3MediaContext()

  const assetUrl = buildAssetUrl({assetType: S3AssetType.FILE, assetId: asset._id})

  if (asset.mimeType.search('audio') === 0) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <audio controls src={assetUrl} style={{width: '100%'}} />
      </Flex>
    )
  }

  if (asset.mimeType.search('video') === 0) {
    return (
      <video
        controls
        autoPlay
        src={assetUrl}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    )
  }

  return <FileIcon extension={asset.extension} width="50%" />
}
