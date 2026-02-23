import {ImageIcon} from '@sanity/icons'
import * as React from 'react'
import {isValidElement} from 'react'

import {S3MediaTool} from '../components'
import {S3MediaContextProvider, S3MediaOptionsContextProvider} from '../contexts'
import {s3Media} from '../plugin'
import {s3File, s3FileAsset, s3Image, s3ImageAsset, s3Video, s3VideoAsset} from '../schema'

const definePluginMock = vi.hoisted(() => vi.fn((factory) => factory))

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    definePlugin: definePluginMock,
  }
})

describe('s3Media plugin', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds plugin config with custom title and layout wrappers', () => {
    expect(definePluginMock).toHaveBeenCalledTimes(1)

    const config = s3Media({title: 'Library'}) as any

    expect(config.name).toBe('s3Media')
    expect(config.schema.types).toEqual([
      s3File,
      s3FileAsset,
      s3Image,
      s3ImageAsset,
      s3Video,
      s3VideoAsset,
    ])

    const tools = (config.tools as (prev: any[]) => any[])([{name: 'desk'}])
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
    const layout = (config.studio.components.layout as (props: any) => any)({
      renderDefault,
      test: true,
    })

    expect(renderDefault).toHaveBeenCalledWith({renderDefault, test: true})
    expect(isValidElement(layout)).toBe(true)
    expect(layout.type).toBe(S3MediaOptionsContextProvider)
    expect(layout.props.options).toEqual({title: 'Library'})

    const innerLayout = layout.props.children
    expect(innerLayout.type).toBe(S3MediaContextProvider)
    expect(innerLayout.props.children).toBe('default-layout')
  })

  it('uses default tool title when options are omitted', () => {
    const config = s3Media() as any

    const tools = (config.tools as (prev: any[]) => any[])([])
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
