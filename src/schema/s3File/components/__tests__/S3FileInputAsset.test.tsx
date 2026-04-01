import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import {of} from 'rxjs'
import type {S3FileAsset, S3VideoAsset} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'
import {mockS3VideoAsset} from 'test/fixtures'

import {S3FileInputAsset} from '../S3FileInputAsset'

const isS3FileSourceMock = vi.fn((_arg: unknown) => true)
const isS3VideoSourceMock = vi.fn((_arg: unknown) => true)

vi.mock('sanity-plugin-s3-media-asset-utils', async () => {
  const actual = await vi.importActual<typeof import('sanity-plugin-s3-media-asset-utils')>(
    'sanity-plugin-s3-media-asset-utils',
  )

  return {
    ...actual,
    isS3FileSource: (arg: unknown) => isS3FileSourceMock(arg),
    isS3VideoSource: (arg: unknown) => isS3VideoSourceMock(arg),
  }
})

const uploaderSource = {
  name: 's3-file',
  title: 'S3 File',
  component: () => null,
  Uploader: class {
    subscribe() {
      void this
      return () => undefined
    }
  },
} as unknown as S3AssetSource

const user = userEvent.setup()

type S3FileInputAssetProps = ComponentProps<typeof S3FileInputAsset>

const createProps = (overrides: Partial<S3FileInputAssetProps> = {}) =>
  ({
    assetSources: [uploaderSource],
    changed: false,
    clearField: vi.fn(),
    elementProps: {
      onFocus: vi.fn(),
      ref: {current: document.createElement('div')},
    } as unknown as S3FileInputAssetProps['elementProps'],
    focused: false,
    id: 'file-field',
    isStale: false,
    isUploading: false,
    observeAsset: vi.fn(() => of({} as S3FileAsset | S3VideoAsset)),
    onCancelUpload: vi.fn(),
    onClearUploadStatus: vi.fn(),
    onSelectFiles: vi.fn(),
    onStale: vi.fn(),
    path: ['fileField'] as S3FileInputAssetProps['path'],
    readOnly: false,
    schemaType: {name: 's3File'} as S3FileInputAssetProps['schemaType'],
    setSelectedAssetSource: vi.fn(),
    value: {} as S3FileInputAssetProps['value'],
    ...overrides,
  }) as S3FileInputAssetProps

describe('S3FileInputAsset', () => {
  it('renders invalid warning when current value has unsupported source shape', async () => {
    const clearField = vi.fn()

    isS3FileSourceMock.mockReturnValueOnce(false)

    renderWithStore(
      <S3FileInputAsset
        {...createProps({
          clearField,
          value: {asset: {_type: 'reference', _ref: 'broken'}} as S3FileInputAssetProps['value'],
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: 'Reset value'}))

    expect(clearField).toHaveBeenCalledTimes(1)
    expect(clearField).toHaveBeenCalledWith(expect.any(Object))
  })

  it('shows stale upload warning and clears stale state on request', async () => {
    const onClearUploadStatus = vi.fn()

    renderWithStore(
      <S3FileInputAsset
        {...createProps({
          isStale: true,
          onClearUploadStatus,
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: 'Clear upload'}))

    expect(onClearUploadStatus).toHaveBeenCalledTimes(1)
    expect(onClearUploadStatus).toHaveBeenCalledWith(expect.any(Object))
  })

  it('renders upload progress while upload exists and wires cancel callback', async () => {
    const onCancelUpload = vi.fn()

    renderWithStore(
      <S3FileInputAsset
        {...createProps({
          isUploading: true,
          onCancelUpload,
          value: {
            _upload: {
              file: {name: 'upload.pdf', type: 'application/pdf'},
              progress: 40,
              updatedAt: new Date().toISOString(),
            },
          } as S3FileInputAssetProps['value'],
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: 'Cancel'}))

    expect(onCancelUpload).toHaveBeenCalledTimes(1)
    expect(onCancelUpload).toHaveBeenCalledWith(expect.any(Object))
  })

  it('renders placeholder and respects direct upload option', async () => {
    const firstRender = renderWithStore(<S3FileInputAsset {...createProps()} />)

    expect(firstRender.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument()

    firstRender.unmount()

    renderWithStore(<S3FileInputAsset {...createProps()} />, {
      options: {directUploads: false},
    })

    expect(screen.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    expect(screen.getByText("Can't upload files here")).toBeInTheDocument()
  })

  it('renders preview actions when value has an asset reference', async () => {
    renderWithStore(
      <S3FileInputAsset
        {...createProps({
          schemaType: {name: 's3Video'} as S3FileInputAssetProps['schemaType'],
          observeAsset: vi.fn(() =>
            of({...mockS3VideoAsset, _id: 's3Video-asset-video-1-1920x1080-mp4'}),
          ),
          value: {asset: {_type: 'reference', _ref: 'video-1'}} as S3FileInputAssetProps['value'],
        })}
      />,
    )

    expect(screen.getByTestId('s3-file-input-asset')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByLabelText('Open file options menu')).toBeInTheDocument()
    })
  })
})
