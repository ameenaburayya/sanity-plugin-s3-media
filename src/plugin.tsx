import {ImageIcon} from '@sanity/icons'
import {definePlugin, type Tool as SanityTool} from 'sanity'

import Tool from './components/Tool'
import {ToolOptionsProvider} from './contexts/ToolOptionsContext'
import {s3AssetSourceData, s3File, s3FileAsset, s3Image, s3ImageAsset} from './schema'
import type {MediaToolOptions} from './types'

const plugin = {
  icon: ImageIcon,
  name: 'media',
  title: 'Media',
}

const tool = {
  ...plugin,
  component: Tool,
} satisfies SanityTool

export const s3Media = definePlugin<MediaToolOptions | void>((options) => ({
  name: 'media',
  studio: {
    components: {
      layout: (props) => (
        <ToolOptionsProvider options={options}>{props.renderDefault(props)}</ToolOptionsProvider>
      ),
    },
  },
  schema: {
    types: [s3AssetSourceData, s3File, s3FileAsset, s3Image, s3ImageAsset],
  },
  tools: (prev) => {
    return [...prev, tool]
  },
}))
