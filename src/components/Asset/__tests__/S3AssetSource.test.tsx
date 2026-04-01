import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3AssetSource} from '../S3AssetSource'

const S3MediaSource = () => null

describe('S3AssetSource', () => {
  it('renders media browser in select mode', () => {
    const onClose = vi.fn()

    renderWithStore(
      <S3AssetSource
        action="select"
        assetSource={{
          name: 's3media',
          title: 'S3 Media',
          component: S3MediaSource,
          Uploader: undefined,
        }}
        accept="*/*"
        selectionType="single"
        selectedAssets={[]}
        onClose={onClose}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByTestId('media-portal')).toBeInTheDocument()
  })

  it('renders nothing when action is not select', () => {
    const onClose = vi.fn()

    renderWithStore(
      <S3AssetSource
        action="upload"
        assetSource={{
          name: 's3media',
          title: 'S3 Media',
          component: S3MediaSource,
          Uploader: undefined,
        }}
        accept="*/*"
        selectionType="single"
        selectedAssets={[]}
        onClose={onClose}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
  })
})
