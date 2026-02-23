import * as React from 'react'
import {isValidElement} from 'react'

import {s3Media} from '../plugin'

const definePluginMock = vi.hoisted(() => vi.fn((factory) => factory))
const {imageIcon, mediaTool, optionsProvider, mediaProvider, s3File, s3FileAsset, s3Image, s3ImageAsset} =
  vi.hoisted(() => ({
    imageIcon: Symbol('ImageIcon'),
    mediaTool: Symbol('S3MediaTool'),
    optionsProvider: Symbol('S3MediaOptionsContextProvider'),
    mediaProvider: Symbol('S3MediaContextProvider'),
    s3File: {name: 's3File'},
    s3FileAsset: {name: 's3FileAsset'},
    s3Image: {name: 's3Image'},
    s3ImageAsset: {name: 's3ImageAsset'},
  }))

vi.mock('sanity', () => ({
  definePlugin: definePluginMock,
}))

vi.mock('@sanity/icons', () => ({
  ImageIcon: imageIcon,
}))

vi.mock('../components', () => ({
  S3MediaTool: mediaTool,
}))

vi.mock('../contexts', () => ({
  S3MediaOptionsContextProvider: optionsProvider,
  S3MediaContextProvider: mediaProvider,
}))

vi.mock('../schema', () => ({
  s3File,
  s3FileAsset,
  s3Image,
  s3ImageAsset,
}))

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
    expect(config.schema.types).toEqual([s3File, s3FileAsset, s3Image, s3ImageAsset])

    const tools = (config.tools as (prev: any[]) => any[])([{name: 'desk'}])
    expect(tools).toEqual([
      {name: 'desk'},
      {
        icon: imageIcon,
        name: 's3media',
        title: 'Library',
        component: mediaTool,
      },
    ])

    const renderDefault = vi.fn(() => 'default-layout')
    const layout = (config.studio.components.layout as (props: any) => any)({
      renderDefault,
      test: true,
    })

    expect(renderDefault).toHaveBeenCalledWith({renderDefault, test: true})
    expect(isValidElement(layout)).toBe(true)
    expect(layout.type).toBe(optionsProvider)
    expect(layout.props.options).toEqual({title: 'Library'})

    const innerLayout = layout.props.children
    expect(innerLayout.type).toBe(mediaProvider)
    expect(innerLayout.props.children).toBe('default-layout')
  })

  it('uses default tool title when options are omitted', () => {
    const config = s3Media() as any

    const tools = (config.tools as (prev: any[]) => any[])([])
    expect(tools).toEqual([
      {
        icon: imageIcon,
        name: 's3media',
        title: 'S3 Media',
        component: mediaTool,
      },
    ])
  })
})
