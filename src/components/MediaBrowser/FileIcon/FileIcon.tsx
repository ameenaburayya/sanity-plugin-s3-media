import {Box, Flex} from '@sanity/ui'
import {type FC, type MouseEvent} from 'react'
import type {DefaultExtensionType} from 'react-file-icon'
import {defaultStyles, FileIcon as ReactFileIcon} from 'react-file-icon'
import {styled} from 'styled-components'
import {S3AssetType, type S3FileAsset} from '../../../types'
import {useS3MediaContext} from '../../../contexts'

type FileIconProps = {
  extension?: string
  onClick?: (e: MouseEvent) => void
  width: string
  asset?: S3FileAsset
}

// Force react-file-icon styles
const Container = styled(Box)`
  text {
    font-size: 8px !important;
    font-weight: 500 !important;
  }
`

export const FileIcon: FC<FileIconProps> = (props) => {
  const {extension, onClick, width, asset} = props

  const {buildAssetUrl} = useS3MediaContext()

  const assetUrl = asset ? buildAssetUrl({assetType: S3AssetType.FILE, assetId: asset._id}) : null

  return (
    <Flex align="center" justify="center" onClick={onClick} style={{height: '100%'}}>
      {assetUrl && asset?.mimeType.search('video') === 0 ? (
        <video
          autoPlay
          loop
          src={assetUrl}
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <Container style={{width}}>
          {extension ? (
            <ReactFileIcon
              extension={extension}
              {...defaultStyles[extension as DefaultExtensionType]}
            />
          ) : (
            <ReactFileIcon />
          )}
        </Container>
      )}
    </Flex>
  )
}
