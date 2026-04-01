import {screen} from '@testing-library/react'
import type {DropzoneOptions} from 'react-dropzone'
import {S3AssetType} from 'sanity-plugin-s3-media-types'
import {uploadsActions} from 'src/modules'
import {renderWithStore} from 'src/test/renderWithStore'
import type {RootReducerState, S3AssetSourceComponentProps, S3MediaPluginOptions} from 'src/types'
import {createPreloadedState} from 'test/fixtures'

import {UploadDropzone} from '../UploadDropzone'

type RenderOptionsWithEvents = NonNullable<DropzoneOptions['onDrop']>
type DropRejectedOptions = NonNullable<DropzoneOptions['onDropRejected']>
type EventArg = Parameters<RenderOptionsWithEvents>[2]

const dropzoneMock = vi.hoisted(() => ({
  isDragActive: false,
  lastOptions: null as DropzoneOptions | null,
  open: vi.fn(),
}))

vi.mock('react-dropzone', () => ({
  useDropzone: (options: DropzoneOptions) => {
    dropzoneMock.lastOptions = options

    return {
      getInputProps: () => ({'aria-label': 'Upload files'}),
      getRootProps: () => ({'data-testid': 'upload-dropzone-root'}),
      isDragActive: dropzoneMock.isDragActive,
      open: dropzoneMock.open,
    }
  },
}))

type RenderUploadDropzoneOptions = {
  assetTypes?: S3AssetType[]
  onSelect?: S3AssetSourceComponentProps['onSelect']
  pluginOptions?: S3MediaPluginOptions
}

const renderUploadDropzone = (options: RenderUploadDropzoneOptions = {}) => {
  const {assetTypes = [S3AssetType.IMAGE], onSelect, pluginOptions} = options

  const preloadedState = createPreloadedState({
    assets: {
      assetTypes,
    } as RootReducerState['assets'],
  })

  return renderWithStore(
    <UploadDropzone>
      <div>Browser content</div>
    </UploadDropzone>,
    {
      onSelect,
      options: pluginOptions,
      preloadedState,
    },
  )
}

const getDropzoneOptions = () => {
  if (!dropzoneMock.lastOptions) {
    throw new Error('Dropzone options were not set')
  }

  return dropzoneMock.lastOptions
}

describe('UploadDropzone', () => {
  beforeEach(() => {
    dropzoneMock.isDragActive = false
    dropzoneMock.lastOptions = null
    dropzoneMock.open = vi.fn()
  })

  it('renders children and configures image uploads by default', () => {
    renderUploadDropzone()

    expect(screen.getByText('Browser content')).toBeInTheDocument()
    expect(getDropzoneOptions().accept).toBe('image/*')
    expect(getDropzoneOptions().noDrag).toBe(false)
  })

  it('configures video-only uploads when asset type is video', () => {
    renderUploadDropzone({assetTypes: [S3AssetType.VIDEO]})

    expect(getDropzoneOptions().accept).toBe('video/*')
  })

  it('disables drag-and-drop when selecting assets from a source field', () => {
    renderUploadDropzone({onSelect: vi.fn()})

    expect(getDropzoneOptions().noDrag).toBe(true)
  })

  it('disables uploads when direct uploads are turned off', () => {
    renderUploadDropzone({
      pluginOptions: {
        directUploads: false,
      },
    })

    expect(getDropzoneOptions().disabled).toBe(true)
  })

  it('shows the drag-active overlay when files are being dragged', () => {
    dropzoneMock.isDragActive = true
    renderUploadDropzone()

    expect(screen.getByText('Drop files to upload')).toBeInTheDocument()
  })

  it('dispatches upload requests for dropped files', async () => {
    const firstFile = new File(['first'], 'first.png', {type: 'image/png'})
    const secondFile = new File(['second'], 'second.png', {type: 'image/png'})

    const uploadRequestSpy = vi.spyOn(uploadsActions, 'uploadRequest')

    renderUploadDropzone({assetTypes: [S3AssetType.IMAGE]})

    await getDropzoneOptions().onDrop?.([firstFile, secondFile], [], {} as EventArg)

    expect(uploadRequestSpy).toHaveBeenCalledTimes(2)
    expect(uploadRequestSpy).toHaveBeenNthCalledWith(1, {
      file: firstFile,
      forceAsAssetType: S3AssetType.IMAGE,
    })
    expect(uploadRequestSpy).toHaveBeenNthCalledWith(2, {
      file: secondFile,
      forceAsAssetType: S3AssetType.IMAGE,
    })
  })

  it('adds an error notification when dropped files are too large', () => {
    const {store} = renderUploadDropzone()

    getDropzoneOptions().onDropRejected?.(
      [
        {
          errors: [{code: 'file-too-large', message: 'File is too large'}],
          file: new File(['x'], 'large-file.mov', {type: 'video/quicktime'}),
        },
      ],
      {} as Parameters<DropRejectedOptions>[1],
    )

    expect(store.getState().notifications.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'error',
          title: 'One or more files exceed the maximum upload size.',
        }),
      ]),
    )
  })

  it('filters unsupported dropped items and notifies the user', async () => {
    const validFile = new File(['valid'], 'valid.png', {type: 'image/png'})
    const invalidFile = {
      name: 'folder',
      slice: () => ({
        arrayBuffer: () => Promise.reject(new Error('Unsupported item')),
      }),
    } as File

    const fileList = {
      0: validFile,
      1: invalidFile,
      item: (index: number) => [validFile, invalidFile][index] || null,
      length: 2,
    } as unknown as FileList

    const {store} = renderUploadDropzone()

    const files = (await getDropzoneOptions().getFilesFromEvent?.({
      target: {
        files: fileList,
      } as unknown as EventTarget,
      type: 'change',
    } as unknown as Event)) as File[]

    expect(files).toEqual([validFile])
    expect(store.getState().notifications.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'error',
          title: "Unable to upload some items (folders and packages aren't supported)",
        }),
      ]),
    )
  })
})
