import {fireEvent, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource, S3FileSchemaType, S3ImageSchemaType} from 'src/types'

import {UploadTargetCard} from '../UploadTargetCard'

const user = userEvent.setup()

const createAssetSource = (name: string, title = name): S3AssetSource =>
  ({
    name,
    title,
    component: () => null,
    Uploader: class MockUploader {},
  }) as unknown as S3AssetSource

const createSchemaType = (accept = 'image/*') =>
  ({
    name: 's3Image',
    title: 'Image',
    type: 'object',
    options: {accept},
  }) as unknown as S3FileSchemaType | S3ImageSchemaType

const createDataTransfer = (
  files: File[] = [],
  items = files.map((file) => ({kind: 'file', type: file.type})),
): DataTransfer =>
  ({
    files,
    items,
  }) as unknown as DataTransfer

const getFileTarget = (): HTMLElement => {
  return screen.getByTestId('upload-file-target')
}

describe('UploadTargetCard', () => {
  it('shows accepted/rejected drop state when files are dragged over the target', () => {
    const onSetHoveringFiles = vi.fn()

    renderWithStore(
      <UploadTargetCard
        assetSources={[createAssetSource('primary', 'Primary bucket')]}
        directUploads
        onSetHoveringFiles={onSetHoveringFiles}
        schemaType={createSchemaType('image/*')}
      >
        <div>Current content</div>
      </UploadTargetCard>,
    )
    const target = getFileTarget()
    const hoveredItems = [
      {kind: 'file', type: 'image/png'},
      {kind: 'file', type: 'application/pdf'},
    ]

    fireEvent.dragEnter(target, {
      dataTransfer: createDataTransfer([], hoveredItems),
    })

    expect(onSetHoveringFiles).toHaveBeenCalledTimes(1)
    expect(onSetHoveringFiles).toHaveBeenCalledWith(hoveredItems)
    expect(screen.getByText('Drop to upload')).toBeInTheDocument()
    expect(screen.getByText("1 file can't be uploaded here")).toBeInTheDocument()
  })

  it('uploads dropped files directly when a single upload source is available', async () => {
    const onSelectFile = vi.fn()
    const source = createAssetSource('primary', 'Primary bucket')
    const schemaType = createSchemaType('image/*')
    const file = new File(['hello'], 'asset.png', {type: 'image/png'})

    renderWithStore(
      <UploadTargetCard
        assetSources={[source]}
        directUploads
        onSelectFile={onSelectFile}
        schemaType={schemaType}
      >
        <div>Current content</div>
      </UploadTargetCard>,
    )

    fireEvent.drop(getFileTarget(), {
      dataTransfer: createDataTransfer([file]),
    })

    await waitFor(() => {
      expect(onSelectFile).toHaveBeenCalledTimes(1)
    })
    expect(onSelectFile).toHaveBeenCalledWith(
      expect.objectContaining({
        assetSource: source,
        file,
        schemaType,
      }),
    )
  })

  it('prompts for destination when multiple upload sources are available', async () => {
    const onSelectFile = vi.fn()
    const primary = createAssetSource('primary', 'Primary bucket')
    const archive = createAssetSource('archive', 'Archive bucket')
    const file = new File(['hello'], 'asset.png', {type: 'image/png'})

    renderWithStore(
      <UploadTargetCard
        assetSources={[primary, archive]}
        directUploads
        onSelectFile={onSelectFile}
        schemaType={createSchemaType('image/*')}
      >
        <div>Current content</div>
      </UploadTargetCard>,
    )

    fireEvent.drop(getFileTarget(), {
      dataTransfer: createDataTransfer([file]),
    })

    await waitFor(() => {
      expect(
        screen.getByText('Upload files to:'),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', {name: 'Archive bucket'}))

    await waitFor(() => {
      expect(onSelectFile).toHaveBeenCalledTimes(1)
      expect(onSelectFile).toHaveBeenCalledWith(
        expect.objectContaining({
          assetSource: archive,
          file,
        }),
      )
    })
  })
})
