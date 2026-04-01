import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {AssetFromSource, SanityDocument} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import {createPreloadedState} from 'test/fixtures'

import {Header} from '../Header'

const user = userEvent.setup()

describe('Header', () => {
  it('shows insert mode title and selected document type when used as an asset source', () => {
    renderWithStore(<Header />, {
      onSelect: vi.fn((selection: AssetFromSource[]) => {
        void selection
      }),
      preloadedState: createPreloadedState({
        assets: {
          assetTypes: ['image', 'video'] as unknown as S3AssetType[],
        },
        selected: {
          document: {_id: 'post-1', _type: 'post'} as unknown as SanityDocument,
        },
      }),
    })

    expect(screen.getByText('Insert image or video')).toBeInTheDocument()
    expect(screen.getByText('post')).toBeInTheDocument()
  })

  it('calls openDropzone when upload button is clicked', async () => {
    const openDropzone = vi.fn()

    renderWithStore(<Header />, {
      openDropzone,
      preloadedState: createPreloadedState({
        assets: {
          assetTypes: ['image'] as unknown as S3AssetType[],
        },
      }),
    })

    await user.click(screen.getByRole('button', {name: 'Upload images'}))

    expect(openDropzone).toHaveBeenCalledTimes(1)
    expect(openDropzone).toHaveBeenCalledWith(expect.any(Object))
  })

  it('hides upload button when direct uploads are disabled', () => {
    renderWithStore(<Header />, {
      options: {
        directUploads: false,
      },
    })

    expect(screen.queryByRole('button', {name: /Upload/i})).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()

    renderWithStore(<Header onClose={onClose} />, {
      options: {
        directUploads: false,
      },
    })

    await user.click(screen.getByRole('button'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith(expect.any(Object))
  })
})
