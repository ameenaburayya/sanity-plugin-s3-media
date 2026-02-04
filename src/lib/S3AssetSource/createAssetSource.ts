import {DocumentsIcon, ImageIcon} from '@sanity/icons'

import {S3AssetSource as S3AssetSourceComponent} from '../../components'
import type {S3AssetSource} from '../../types'
import type {CreateS3AssetSourceProps} from './types'
import {createS3Uploader} from './uploader'

const sourceName = 's3-media'

export function createS3ImageAssetSource(props: CreateS3AssetSourceProps): S3AssetSource {
  return {
    name: sourceName,
    title: props.title,
    component: S3AssetSourceComponent,
    icon: ImageIcon,
    Uploader: createS3Uploader(props),
  }
}

export function createS3FileAssetSource(props: CreateS3AssetSourceProps): S3AssetSource {
  return {
    name: sourceName,
    title: props.title,
    component: S3AssetSourceComponent,
    icon: DocumentsIcon,
    Uploader: createS3Uploader(props),
  }
}
