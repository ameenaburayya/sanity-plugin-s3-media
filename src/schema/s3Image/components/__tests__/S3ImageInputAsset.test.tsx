import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import type {InputProps, UploadState} from 'sanity'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'

import type {S3ImageInputProps} from '../../types'
import {S3ImageInputAsset} from '../S3ImageInputAsset'

const user = userEvent.setup()
const tryGetS3ImageDimensionsMock = vi.fn((_arg: unknown) => ({width: 1200, height: 800}))

vi.mock('sanity-plugin-s3-media-asset-utils', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    'sanity-plugin-s3-media-asset-utils',
  )

  return {
    ...actual,
    tryGetS3ImageDimensions: (arg: unknown) => tryGetS3ImageDimensionsMock(arg),
  }
})

const source: S3AssetSource = {
  name: 's3-image',
  title: 'S3 Image',
  component: () => null,
}

type S3ImageInputAssetProps = ComponentProps<typeof S3ImageInputAsset>
const createProps = (overrides: Partial<S3ImageInputAssetProps> = {}): S3ImageInputAssetProps => ({
  assetSources: [source],
  elementProps: {
    onFocus: vi.fn(),
    ref: {current: document.createElement('div')},
  } as unknown as S3ImageInputAssetProps['elementProps'],
  handleClearUploadState: vi.fn(),
  inputProps: {
    changed: false,
    elementProps: {
      onFocus: vi.fn(),
    },
    focused: false,
    path: ['imageField'],
  } as unknown as Omit<InputProps, 'renderDefault'>,
  isStale: false,
  onSelectFile: vi.fn(),
  readOnly: false,
  renderAssetMenu: vi.fn(() => <div>asset-menu</div>),
  renderPreview: vi.fn(() => <div>image-preview</div>),
  renderUploadPlaceholder: vi.fn(() => <div>upload-placeholder</div>),
  renderUploadState: vi.fn(() => <div>upload-state</div>),
  schemaType: {
    name: 's3Image',
    options: {accept: 'image/*'},
  } as unknown as S3ImageInputProps['schemaType'],
  selectedAssetSource: null,
  value: {} as S3ImageInputProps['value'],
  ...overrides,
})

describe('S3ImageInputAsset', () => {
  it('shows stale warning and clears stale upload state on action', async () => {
    const handleClearUploadState = vi.fn()

    renderWithStore(
      <S3ImageInputAsset
        {...createProps({
          isStale: true,
          handleClearUploadState,
        })}
      />,
    )

    await user.click(screen.getByRole('button', {name: 'Clear upload'}))

    expect(handleClearUploadState).toHaveBeenCalledTimes(1)
    expect(handleClearUploadState).toHaveBeenCalledWith(expect.any(Object))
    expect(screen.getByTestId('s3-image-input-asset')).toBeInTheDocument()
  })

  it('renders upload state branch when upload value exists', () => {
    const renderUploadState = vi.fn(() => <div>upload-state</div>)
    const renderUploadPlaceholder = vi.fn(() => <div>upload-placeholder</div>)

    renderWithStore(
      <S3ImageInputAsset
        {...createProps({
          renderUploadPlaceholder,
          renderUploadState,
          value: {
            _upload: {
              file: {name: 'image.png', type: 'image/png'},
              progress: 25,
              updatedAt: new Date().toISOString(),
            } as unknown as UploadState,
          } as S3ImageInputProps['value'],
        })}
      />,
    )

    expect(renderUploadState).toHaveBeenCalledTimes(1)
    expect(renderUploadState).toHaveBeenCalledWith(expect.objectContaining({progress: 25}))
    expect(renderUploadPlaceholder).not.toHaveBeenCalled()
    expect(screen.getByTestId('s3-image-input-asset')).toBeInTheDocument()
    expect(screen.getByText('upload-state')).toBeInTheDocument()
  })

  it('renders placeholder when no asset is selected', () => {
    const renderUploadPlaceholder = vi.fn(() => <div>upload-placeholder</div>)

    renderWithStore(
      <S3ImageInputAsset
        {...createProps({
          renderUploadPlaceholder,
          value: {} as S3ImageInputProps['value'],
        })}
      />,
    )

    expect(renderUploadPlaceholder).toHaveBeenCalledTimes(1)
    expect(renderUploadPlaceholder).toHaveBeenCalledWith()
    expect(screen.getByTestId('s3-image-input-asset')).toBeInTheDocument()
    expect(screen.getByText('upload-placeholder')).toBeInTheDocument()
    expect(screen.queryByText('asset-menu')).not.toBeInTheDocument()
  })

  it('renders preview and asset menu when an asset is present', () => {
    const renderPreview = vi.fn(() => <div>image-preview</div>)
    const renderAssetMenu = vi.fn(() => <div>asset-menu</div>)

    renderWithStore(
      <S3ImageInputAsset
        {...createProps({
          renderAssetMenu,
          renderPreview,
          value: {
            asset: {_type: 'reference', _ref: 'asset-image-1'},
          } as S3ImageInputProps['value'],
        })}
      />,
    )

    expect(renderPreview).toHaveBeenCalledTimes(1)
    expect(renderPreview).toHaveBeenCalledWith()
    expect(renderAssetMenu).toHaveBeenCalledTimes(1)
    expect(renderAssetMenu).toHaveBeenCalledWith()
    expect(screen.getByText('image-preview')).toBeInTheDocument()
    expect(screen.getByText('asset-menu')).toBeInTheDocument()
    const rootElement = screen.getByTestId('s3-image-input-asset')

    expect(rootElement).toHaveAttribute('style', expect.stringContaining('--image-width: 1200'))
    expect(rootElement).toHaveAttribute('style', expect.stringContaining('--image-height: 800'))
  })
})
