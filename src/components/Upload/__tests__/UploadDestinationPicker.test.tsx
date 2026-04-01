import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'

import {UploadDestinationPicker} from '../UploadDestinationPicker'

const user = userEvent.setup()
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

describe('UploadDestinationPicker', () => {
  it('renders nothing when there are no upload-capable asset sources', () => {
    renderWithStore(
      <UploadDestinationPicker
        assetSources={[
          createAssetSource('library', {title: 'Library', withUploader: false}),
          createAssetSource('archive', {title: 'Archive', withUploader: false}),
        ]}
        text="Select destination"
      />,
    )

    expect(screen.queryByText('Select destination')).not.toBeInTheDocument()
  })

  it('renders upload-capable sources and selects a destination on click', async () => {
    const onSelectAssetSource = vi.fn()
    const uploadSource = createAssetSource('primary', {title: 'Primary bucket'})

    renderWithStore(
      <UploadDestinationPicker
        assetSources={[uploadSource, createAssetSource('library', {withUploader: false})]}
        onSelectAssetSource={onSelectAssetSource}
        text="Select destination"
      />,
    )

    expect(screen.getByText('Select destination')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Primary bucket'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'library'})).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Primary bucket'}))

    expect(onSelectAssetSource).toHaveBeenCalledTimes(1)
    expect(onSelectAssetSource).toHaveBeenCalledWith(uploadSource)
  })
})
