import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'

import {UploadDropDownMenu} from '../UploadDropDownMenu'

const user = userEvent.setup()
const createAssetSource = (name: string, title = name): S3AssetSource =>
  ({
    name,
    title,
    component: () => null,
    Uploader: class MockUploader {},
  }) as unknown as S3AssetSource

describe('UploadDropDownMenu', () => {
  it('renders nothing when fewer than two asset sources are available', () => {
    renderWithStore(
      <UploadDropDownMenu assetSources={[createAssetSource('single', 'Single source')]} />,
    )

    expect(
      screen.queryByRole('button', {
        name: 'Upload',
      }),
    ).not.toBeInTheDocument()
  })

  it('renders upload menu and forwards selected files for the matching asset source', async () => {
    const onSelectFiles = vi.fn()
    const first = createAssetSource('primary', 'Primary')
    const second = createAssetSource('archive', 'Archive')
    const file = new File(['a'], 'asset.png', {type: 'image/png'})

    renderWithStore(
      <UploadDropDownMenu
        accept="image/*"
        assetSources={[first, second]}
        multiple
        onSelectFiles={onSelectFiles}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Upload',
      }),
    ).toBeInTheDocument()

    const primaryInput = screen.getByTestId('upload-file-input-primary')
    const archiveInput = screen.getByTestId('upload-file-input-archive')

    expect(primaryInput).toBeInTheDocument()
    expect(archiveInput).toBeInTheDocument()
    expect(primaryInput).toHaveAttribute('accept', 'image/*')
    expect(primaryInput).toHaveAttribute('multiple')

    await user.upload(archiveInput, file)

    expect(onSelectFiles).toHaveBeenCalledTimes(1)
    expect(onSelectFiles).toHaveBeenCalledWith(second, [file])
  })

  it('disables uploads when direct uploads are turned off', () => {
    const first = createAssetSource('primary', 'Primary')
    const second = createAssetSource('archive', 'Archive')

    renderWithStore(
      <UploadDropDownMenu assetSources={[first, second]} directUploads={false} readOnly={false} />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Upload',
      }),
    ).toBeDisabled()
  })

  it('opens the file input when a menu item is clicked', async () => {
    const first = createAssetSource('primary', 'Primary')
    const second = createAssetSource('archive', 'Archive')

    renderWithStore(<UploadDropDownMenu assetSources={[first, second]} />)

    const archiveInput = screen.getByTestId('upload-file-input-archive') as HTMLInputElement
    const clickSpy = vi.spyOn(archiveInput, 'click')

    await user.click(
      screen.getByRole('button', {
        name: 'Upload',
      }),
    )
    await user.click(await screen.findByRole('menuitem', {name: 'Archive', hidden: true}))

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledWith()
  })
})
