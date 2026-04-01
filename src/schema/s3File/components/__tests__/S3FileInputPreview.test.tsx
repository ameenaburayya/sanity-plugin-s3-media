import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import {of} from 'rxjs'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'
import {mockS3FileAsset} from 'test/fixtures'

import {S3FileInputPreview} from '../S3FileInputPreview'

type S3FileInputPreviewProps = ComponentProps<typeof S3FileInputPreview>

const resolvedFileAsset = {
  ...mockS3FileAsset,
  _id: 's3File-asset-doc-pdf',
  size: 20,
  originalFilename: 'doc.pdf',
  extension: 'pdf',
  mimeType: 'application/pdf',
}

const createSource = (name: string, withUploader = false): S3AssetSource => ({
  name,
  title: name.toUpperCase(),
  component: () => null,
  ...(withUploader
    ? {
        Uploader: class {
          subscribe() {
            void this
            return () => undefined
          }
        },
      }
    : {}),
} as unknown as S3AssetSource)

const user = userEvent.setup()

describe('S3FileInputPreview', () => {
  it('renders nothing when there is no referenced asset', () => {
    renderWithStore(
      <S3FileInputPreview
        assetSources={[createSource('library')]}
        clearField={vi.fn()}
        observeAsset={vi.fn(() => of(resolvedFileAsset))}
        onSelectFiles={vi.fn()}
        readOnly={false}
        schemaType={{name: 's3File'} as unknown as S3FileInputPreviewProps['schemaType']}
        setSelectedAssetSource={vi.fn()}
        value={{_type: 's3File'} as S3FileInputPreviewProps['value']}
      />,
    )

    expect(screen.queryByTestId('s3-file-input-preview')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Open file options menu')).not.toBeInTheDocument()
  })

  it('opens menu and supports browse + clear actions', async () => {
    const clearField = vi.fn()
    const setSelectedAssetSource = vi.fn()
    const observeAsset = vi.fn(() => of(resolvedFileAsset))

    const source = createSource('library')

    renderWithStore(
      <S3FileInputPreview
        assetSources={[source]}
        clearField={clearField}
        observeAsset={observeAsset}
        onSelectFiles={vi.fn()}
        readOnly={false}
        schemaType={{name: 's3File', options: {accept: 'application/pdf'}} as unknown as S3FileInputPreviewProps['schemaType']}
        setSelectedAssetSource={setSelectedAssetSource}
        value={
          {
            asset: {_type: 'reference', _ref: 's3File-asset-doc-pdf'},
          } as S3FileInputPreviewProps['value']
        }
      />,
    )

    expect(observeAsset).toHaveBeenCalledTimes(1)
    expect(observeAsset).toHaveBeenCalledWith('s3File-asset-doc-pdf')
    expect(screen.getByTestId('s3-file-input-preview')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Open file options menu'))
    await user.click(screen.getByText('Browse'))

    expect(setSelectedAssetSource).toHaveBeenCalledTimes(1)
    expect(setSelectedAssetSource).toHaveBeenCalledWith(source)

    await user.click(screen.getByLabelText('Open file options menu'))
    await user.click(screen.getByText('Clear field'))

    expect(clearField).toHaveBeenCalledTimes(1)
    expect(clearField).toHaveBeenCalledWith(expect.any(Object))
  })

  it('renders upload actions for uploader sources', async () => {
    renderWithStore(
      <S3FileInputPreview
        assetSources={[createSource('upload-one', true), createSource('upload-two', true)]}
        clearField={vi.fn()}
        observeAsset={vi.fn(() => of(resolvedFileAsset))}
        onSelectFiles={vi.fn()}
        readOnly={false}
        schemaType={{name: 's3File'} as unknown as S3FileInputPreviewProps['schemaType']}
        setSelectedAssetSource={vi.fn()}
        value={
          {
            asset: {_type: 'reference', _ref: 's3File-asset-doc-pdf'},
          } as S3FileInputPreviewProps['value']
        }
      />,
    )

    expect(screen.getByTestId('s3-file-input-preview')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Open file options menu'))

    expect(screen.getByText('Upload')).toBeInTheDocument()
  })
})
