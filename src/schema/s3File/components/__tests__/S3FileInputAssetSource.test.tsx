import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps, type FC, type PropsWithChildren} from 'react'
import {of} from 'rxjs'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import type {S3AssetSource, S3AssetSourceComponentProps} from 'src/types'
import {mockS3FileAsset} from 'test/fixtures'

import {S3FileInputAssetSource} from '../S3FileInputAssetSource'

type S3FileInputAssetSourceProps = ComponentProps<typeof S3FileInputAssetSource>

const Wrapper: FC<PropsWithChildren> = ({children}) => (
  <ThemeProvider theme={studioTheme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

const user = userEvent.setup()
const resolvedAsset = {...mockS3FileAsset, _id: 'asset-resolved'}

describe('S3FileInputAssetSource', () => {
  it('renders nothing when no source is selected', () => {
    render(
      <S3FileInputAssetSource
        isUploading={false}
        observeAsset={vi.fn()}
        onSelectAssets={vi.fn()}
        schemaType={
          {
            name: 's3File',
            options: {accept: 'application/pdf'},
          } as unknown as S3FileInputAssetSourceProps['schemaType']
        }
        selectedAssetSource={null}
        setSelectedAssetSource={vi.fn()}
        value={{} as S3FileInputAssetSourceProps['value']}
      />,
      {wrapper: Wrapper},
    )

    expect(screen.queryByText(/action:/)).not.toBeInTheDocument()
  })

  it('renders selected source component without preselected assets when value has no asset', () => {
    const sourceComponentSpy = vi.fn((props: S3AssetSourceComponentProps) => (
      <div>
        <span>action:{props.action}</span>
        <span>accept:{props.accept}</span>
        <span>selected:{props.selectedAssets.length}</span>
        <span>title:{String(props.dialogHeaderTitle)}</span>
      </div>
    ))

    const selectedAssetSource: S3AssetSource = {
      name: 's3-file',
      title: 'S3 File',
      component: sourceComponentSpy,
    }

    render(
      <S3FileInputAssetSource
        isUploading={false}
        observeAsset={vi.fn()}
        onSelectAssets={vi.fn()}
        schemaType={
          {
            name: 's3File',
            options: {accept: 'application/pdf'},
          } as unknown as S3FileInputAssetSourceProps['schemaType']
        }
        selectedAssetSource={selectedAssetSource}
        setSelectedAssetSource={vi.fn()}
        value={{_type: 's3File'} as S3FileInputAssetSourceProps['value']}
      />,
      {wrapper: Wrapper},
    )

    expect(screen.getByText('action:select')).toBeInTheDocument()
    expect(screen.getByText('accept:application/pdf')).toBeInTheDocument()
    expect(screen.getByText('selected:0')).toBeInTheDocument()
    expect(screen.getByText('title:Select file')).toBeInTheDocument()
  })

  it('resolves existing asset and passes it as selected asset for video fields', async () => {
    const setSelectedAssetSource = vi.fn()
    const observeAsset = vi.fn(() => of(resolvedAsset))

    const sourceComponentSpy = vi.fn((props: S3AssetSourceComponentProps) => (
      <div>
        <span>action:{props.action}</span>
        <span>accept:{props.accept}</span>
        <span>selected-id:{props.selectedAssets[0]?._id}</span>
        <span>asset-type:{props.assetType}</span>
        <span>title:{String(props.dialogHeaderTitle)}</span>
        <button onClick={props.onClose} type="button">
          Close source
        </button>
      </div>
    ))

    const selectedAssetSource: S3AssetSource = {
      name: 's3-video',
      title: 'S3 Video',
      component: sourceComponentSpy,
    }

    render(
      <S3FileInputAssetSource
        isUploading
        observeAsset={observeAsset}
        onSelectAssets={vi.fn()}
        schemaType={{name: 's3Video'} as unknown as S3FileInputAssetSourceProps['schemaType']}
        selectedAssetSource={selectedAssetSource}
        setSelectedAssetSource={setSelectedAssetSource}
        value={
          {
            asset: {_type: 'reference', _ref: 'video-asset-id'},
          } as S3FileInputAssetSourceProps['value']
        }
      />,
      {wrapper: Wrapper},
    )

    expect(screen.getByText('action:upload')).toBeInTheDocument()
    expect(screen.getByText('accept:video/*')).toBeInTheDocument()
    expect(screen.getByText('selected-id:asset-resolved')).toBeInTheDocument()
    expect(screen.getByText(`asset-type:${S3AssetType.VIDEO}`)).toBeInTheDocument()
    expect(screen.getByText('title:S3 Video')).toBeInTheDocument()
    expect(observeAsset).toHaveBeenCalledTimes(1)
    expect(observeAsset).toHaveBeenCalledWith('video-asset-id')

    await user.click(screen.getByRole('button', {name: 'Close source'}))

    expect(setSelectedAssetSource).toHaveBeenCalledTimes(1)
    expect(setSelectedAssetSource).toHaveBeenCalledWith(null)
  })
})
