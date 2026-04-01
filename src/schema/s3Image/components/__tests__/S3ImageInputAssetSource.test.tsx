import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import {of} from 'rxjs'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource, S3AssetSourceComponentProps} from 'src/types'
import {mockS3ImageAsset} from 'test/fixtures'

import {S3ImageInputAssetSource} from '../S3ImageInputAssetSource'

const user = userEvent.setup()

type S3ImageInputAssetSourceProps = ComponentProps<typeof S3ImageInputAssetSource>

const resolvedImageAsset = {...mockS3ImageAsset, _id: 'image-resolved'}

describe('S3ImageInputAssetSource', () => {
  it('renders nothing when no source is selected', () => {
    renderWithStore(
      <S3ImageInputAssetSource
        handleAssetSourceClosed={vi.fn()}
        handleSelectAssetFromSource={vi.fn()}
        isUploading={false}
        observeAsset={vi.fn()}
        schemaType={{name: 's3Image'} as unknown as S3ImageInputAssetSourceProps['schemaType']}
        selectedAssetSource={null}
        value={{} as S3ImageInputAssetSourceProps['value']}
      />,
    )

    expect(screen.queryByText(/action:/)).not.toBeInTheDocument()
  })

  it('renders source with empty selected assets when value has no asset', () => {
    const sourceComponentSpy = vi.fn((props: S3AssetSourceComponentProps) => (
      <div>
        <span>action:{props.action}</span>
        <span>accept:{props.accept}</span>
        <span>selected:{props.selectedAssets.length}</span>
      </div>
    ))

    const source: S3AssetSource = {name: 's3-image', component: sourceComponentSpy}

    renderWithStore(
      <S3ImageInputAssetSource
        handleAssetSourceClosed={vi.fn()}
        handleSelectAssetFromSource={vi.fn()}
        isUploading={false}
        observeAsset={vi.fn()}
        schemaType={{name: 's3Image', options: {accept: 'image/webp'}} as unknown as S3ImageInputAssetSourceProps['schemaType']}
        selectedAssetSource={source}
        value={{_type: 's3Image'} as S3ImageInputAssetSourceProps['value']}
      />,
    )

    expect(screen.getByText('action:select')).toBeInTheDocument()
    expect(screen.getByText('accept:image/webp')).toBeInTheDocument()
    expect(screen.getByText('selected:0')).toBeInTheDocument()
  })

  it('resolves referenced image, passes it as selected asset, and closes on request', async () => {
    const handleAssetSourceClosed = vi.fn()
    const observeAsset = vi.fn(() => of(resolvedImageAsset))

    const sourceComponentSpy = vi.fn((props: S3AssetSourceComponentProps) => (
      <div>
        <span>action:{props.action}</span>
        <span>selected-id:{props.selectedAssets[0]?._id}</span>
        <span>asset-type:{props.assetType}</span>
        <button onClick={props.onClose} type="button">
          Close source
        </button>
      </div>
    ))

    renderWithStore(
      <S3ImageInputAssetSource
        handleAssetSourceClosed={handleAssetSourceClosed}
        handleSelectAssetFromSource={vi.fn()}
        isUploading
        observeAsset={observeAsset}
        schemaType={{name: 's3Image'} as unknown as S3ImageInputAssetSourceProps['schemaType']}
        selectedAssetSource={{name: 's3-image', component: sourceComponentSpy} as S3AssetSource}
        value={
          {asset: {_type: 'reference', _ref: 'image-123'}} as S3ImageInputAssetSourceProps['value']
        }
      />,
    )

    expect(screen.getByText('action:upload')).toBeInTheDocument()
    expect(screen.getByText('selected-id:image-resolved')).toBeInTheDocument()
    expect(screen.getByText(`asset-type:${S3AssetType.IMAGE}`)).toBeInTheDocument()
    expect(observeAsset).toHaveBeenCalledTimes(1)
    expect(observeAsset).toHaveBeenCalledWith('image-123')

    await user.click(screen.getByRole('button', {name: 'Close source'}))

    expect(handleAssetSourceClosed).toHaveBeenCalledTimes(1)
    expect(handleAssetSourceClosed).toHaveBeenCalledWith()
  })
})
