import {ImageIcon} from '@sanity/icons'
import * as React from 'react'
import {isValidElement} from 'react'

import {S3MediaTool} from '../components'
import {S3MediaContextProvider, S3MediaOptionsContextProvider} from '../contexts'
import {s3Media} from '../plugin'
import {s3File, s3FileAsset, s3Image, s3ImageAsset, s3Video, s3VideoAsset} from '../schema'

type SanityPluginMock = {
  definePlugin: (factory: (...args: unknown[]) => unknown) => unknown
}

const {definePlugin: definePluginMock} = (globalThis as {__sanityMock: SanityPluginMock})
  .__sanityMock

describe('s3Media plugin', () => {
  type PluginConfig = ReturnType<typeof s3Media>
  type ToolRenderer = (...args: unknown[]) => unknown
  type LayoutRenderer = (props: {renderDefault: (...args: unknown[]) => unknown}) => unknown

  beforeEach(() => {
    vi.stubGlobal('React', React)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds plugin config with custom title and layout wrappers', () => {
    expect(definePluginMock).toHaveBeenCalledTimes(1)

    const config: PluginConfig = s3Media({title: 'Library'})

    expect(config.name).toBe('s3Media')
    expect(config.schema!.types).toEqual([
      s3File,
      s3FileAsset,
      s3Image,
      s3ImageAsset,
      s3Video,
      s3VideoAsset,
    ])

    const tools =
      typeof config.tools === 'function' ? (config.tools as ToolRenderer)([{name: 'desk'}]) : []

    expect(tools).toEqual([
      {name: 'desk'},
      {
        icon: ImageIcon,
        name: 's3media',
        title: 'Library',
        component: S3MediaTool,
      },
    ])

    const renderDefault = vi.fn(() => 'default-layout')
    const layout = config.studio?.components?.layout
      ? (config.studio.components.layout as LayoutRenderer)({
          renderDefault,
        })
      : null

    expect(layout).not.toBeNull()
    expect(isValidElement(layout)).toBe(true)

    type LayoutProps = {
      options: {title?: string}
      children: React.ReactElement<{children: unknown}>
    }
    const layoutEl = layout as React.ReactElement<LayoutProps>

    expect(layoutEl.type).toBe(S3MediaOptionsContextProvider)
    expect(layoutEl.props.options).toEqual({title: 'Library'})

    const innerLayout = layoutEl.props.children

    expect(innerLayout.type).toBe(S3MediaContextProvider)
    expect(innerLayout.props.children).toBe('default-layout')
  })

  it('uses default tool title when options are omitted', () => {
    const config: PluginConfig = s3Media()

    const tools = typeof config.tools === 'function' ? (config.tools as ToolRenderer)([]) : []

    expect(tools).toEqual([
      {
        icon: ImageIcon,
        name: 's3media',
        title: 'S3 Media',
        component: S3MediaTool,
      },
    ])
  })
})
