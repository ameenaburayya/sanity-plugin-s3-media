import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {SchemaType} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'

import {UploadPlaceholder} from '../UploadPlaceholder'

const createAssetSource = (
  name: string,
  {title = name, withUploader = true}: {title?: string; withUploader?: boolean} = {},
): S3AssetSource =>
  ({
    name,
    title,
    component: () => null,
    Uploader: withUploader ? class MockUploader {} : undefined,
  }) as S3AssetSource

const createSchemaType = (name: string, accept: string): SchemaType =>
  ({
    name,
    title: name,
    type: 'object',
    options: {accept},
  }) as unknown as SchemaType

const user = userEvent.setup()

describe('UploadPlaceholder', () => {
  it('renders nothing when there are no upload-capable sources', () => {
    renderWithStore(
      <UploadPlaceholder
        assetSources={[createAssetSource('library', {withUploader: false})]}
        browse={undefined}
        directUploads
        onUpload={vi.fn()}
        readOnly={false}
        schemaType={createSchemaType('s3Image', 'image/*')}
        type={S3AssetType.IMAGE}
      />,
    )

    expect(screen.queryByTestId('upload-placeholder')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Upload'),
    ).not.toBeInTheDocument()
  })

  it('renders a single file input button and uploads selected files', async () => {
    const onUpload = vi.fn()
    const source = createAssetSource('primary', {title: 'Primary bucket'})
    const file = new File(['hello'], 'photo.png', {type: 'image/png'})

    renderWithStore(
      <UploadPlaceholder
        assetSources={[source]}
        browse={<button type="button">Browse existing</button>}
        directUploads
        onUpload={onUpload}
        readOnly={false}
        schemaType={createSchemaType('s3Image', 'image/*')}
        type={S3AssetType.IMAGE}
      />,
    )

    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Browse existing'})).toBeInTheDocument()

    const input = screen.getByLabelText(
      'Upload',
    ) as HTMLInputElement

    expect(input).toHaveAttribute('accept', 'image/*')

    await user.upload(input, file)

    expect(onUpload).toHaveBeenCalledTimes(1)
    expect(onUpload).toHaveBeenCalledWith(source, [file])
  })

  it('shows disabled state and message when direct uploads are blocked', () => {
    renderWithStore(
      <UploadPlaceholder
        assetSources={[createAssetSource('primary', {title: 'Primary bucket'})]}
        browse={undefined}
        directUploads={false}
        onUpload={vi.fn()}
        readOnly={false}
        schemaType={createSchemaType('s3File', 'application/pdf')}
        type={S3AssetType.FILE}
      />,
    )

    expect(screen.getByText("Can't upload files here")).toBeInTheDocument()
    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Upload'),
    ).toBeDisabled()
  })

  it('renders a dropdown upload control when multiple upload sources are available', () => {
    renderWithStore(
      <UploadPlaceholder
        assetSources={[
          createAssetSource('primary', {title: 'Primary bucket'}),
          createAssetSource('archive', {title: 'Archive'}),
        ]}
        browse={undefined}
        directUploads
        onUpload={vi.fn()}
        readOnly={false}
        schemaType={createSchemaType('s3File', 'application/pdf')}
        type={S3AssetType.FILE}
      />,
    )

    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Upload',
      }),
    ).toBeInTheDocument()
  })
})
