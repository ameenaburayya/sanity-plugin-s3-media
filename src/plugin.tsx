import {ImageIcon} from '@sanity/icons'
import {definePlugin, type Tool as SanityTool} from 'sanity'

import {S3MediaTool} from './components'
import {S3MediaContextProvider, S3MediaOptionsContextProvider} from './contexts'
import {s3File, s3FileAsset, s3Image, s3ImageAsset} from './schema'
import type {S3MediaPluginOptions} from './types'

/**
 * Sanity plugin for managing media assets in AWS S3
 * @public
 */
export const s3Media = definePlugin<S3MediaPluginOptions | void>((options) => ({
  name: 's3Media',
  studio: {
    components: {
      layout: (props) => (
        <S3MediaOptionsContextProvider options={options}>
          <S3MediaContextProvider>{props.renderDefault(props)}</S3MediaContextProvider>
        </S3MediaOptionsContextProvider>
      ),
    },
  },
  schema: {
    types: [s3File, s3FileAsset, s3Image, s3ImageAsset],
  },
  tools: (prev) => {
    return [
      ...prev,
      {
        icon: ImageIcon,
        name: 's3media',
        title: options?.title || 'S3 Media',
        component: S3MediaTool,
      } satisfies SanityTool,
    ]
  },
}))
