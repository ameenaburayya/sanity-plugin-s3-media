import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useState} from 'react'
import {of} from 'rxjs'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'
import {mockS3ImageAsset} from 'test/fixtures'

import type {S3ImageInputProps} from '../../types'
import {S3ImageInputAssetMenu} from '../S3ImageInputAssetMenu'

const user = userEvent.setup()
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

type S3ImageInputAssetMenuProps = Parameters<typeof S3ImageInputAssetMenu>[0]
const createProps = (): S3ImageInputAssetMenuProps => ({
  assetSources: [createSource('library')] as S3AssetSource[],
  handleRemoveButtonClick: vi.fn(),
  handleSelectImageFromAssetSource: vi.fn(),
  isMenuOpen: false,
  observeAsset: vi.fn(() => of({...mockS3ImageAsset, _id: 's3Image-resolved-image-1200x800-jpg'})),
  onSelectFile: vi.fn(),
  readOnly: false,
  schemaType: {name: 's3Image', options: {accept: 'image/*'}} as S3ImageInputProps['schemaType'],
  setMenuButtonElement: vi.fn(),
  setMenuOpen: vi.fn(),
  value: {
    asset: {_type: 'reference', _ref: 's3Image-source-1-1200x800-jpg'},
  } as S3ImageInputProps['value'],
})

const renderMenu = (overrides: Partial<ReturnType<typeof createProps>> = {}) => {
  const props = {...createProps(), ...overrides}

  const Harness = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
      <S3ImageInputAssetMenu
        {...props}
        isMenuOpen={isMenuOpen}
        setMenuOpen={(flag) => {
          setIsMenuOpen(flag)
          props.setMenuOpen(flag)
        }}
      />
    )
  }

  renderWithStore(<Harness />)

  return props
}

describe('S3ImageInputAssetMenu', () => {
  it('renders nothing when current value has no asset reference', () => {
    renderMenu({value: {} as S3ImageInputProps['value']})

    expect(screen.queryByLabelText('Open image options menu')).not.toBeInTheDocument()
  })

  it('renders browse action for single source and selects it on click', async () => {
    const props = renderMenu()

    expect(screen.getByTestId('s3-image-actions-menu')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Open image options menu'))
    await user.click(screen.getByText('Select'))

    expect(props.setMenuOpen).toHaveBeenCalledTimes(2)
    expect(props.setMenuOpen).toHaveBeenNthCalledWith(1, true)
    expect(props.setMenuOpen).toHaveBeenNthCalledWith(2, false)
    expect(props.handleSelectImageFromAssetSource).toHaveBeenCalledTimes(1)
    expect(props.handleSelectImageFromAssetSource).toHaveBeenCalledWith(props.assetSources[0])
    expect(props.observeAsset).toHaveBeenCalledTimes(1)
    expect(props.observeAsset).toHaveBeenCalledWith('s3Image-source-1-1200x800-jpg')
  })

  it('renders source-specific browse actions for multiple sources', async () => {
    const props = createProps()
    const sourceOne = createSource('library')
    const sourceTwo = createSource('archive')

    renderMenu({...props, assetSources: [sourceOne, sourceTwo]})

    expect(screen.getByTestId('s3-image-actions-menu')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Open image options menu'))
    await user.click(screen.getByText('ARCHIVE'))

    expect(props.handleSelectImageFromAssetSource).toHaveBeenCalledTimes(1)
    expect(props.handleSelectImageFromAssetSource).toHaveBeenCalledWith(sourceTwo)
  })

  it('renders upload action for uploader sources', async () => {
    renderMenu({assetSources: [createSource('upload', true)]})

    expect(screen.getByTestId('s3-image-actions-menu')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Open image options menu'))

    expect(screen.getByText('Upload')).toBeInTheDocument()
  })
})
