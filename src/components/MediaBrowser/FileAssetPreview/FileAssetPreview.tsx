import {Flex} from '@sanity/ui'
import type {FC} from 'react'
import {type S3Asset, S3AssetType} from 'sanity-plugin-s3-media-types'

import {useS3MediaContext} from '../../../contexts'
import {FileIcon} from '../FileIcon'

type FileAssetPreviewProps = {
  asset: S3Asset
}

export const FileAssetPreview: FC<FileAssetPreviewProps> = (props) => {
  const {asset} = props

  const {buildAssetUrl} = useS3MediaContext()

  const assetUrl = buildAssetUrl({
    assetType: asset._type === 's3VideoAsset' ? S3AssetType.VIDEO : S3AssetType.FILE,
    assetId: asset._id,
  })

  if (asset.mimeType.search('audio') === 0) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <audio controls data-testid="file-preview-audio" src={assetUrl} style={{width: '100%'}} />
      </Flex>
    )
  }

  if (asset.mimeType.search('video') === 0) {
    return (
      <video
        controls
        autoPlay
        data-testid="file-preview-video"
        muted
        loop
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
