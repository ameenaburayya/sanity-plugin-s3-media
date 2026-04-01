import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {S3Asset} from 'sanity-plugin-s3-media-types'
import {renderWithStore} from 'src/test/renderWithStore'
import type {AssetItem} from 'src/types'
import {mockS3FileAsset, mockS3ImageAsset} from 'test/fixtures'

import {AssetMetadata} from '../AssetMetadata'

const user = userEvent.setup()

const imageAsset = mockS3ImageAsset as S3Asset
const imageItem: AssetItem = {
  _type: 'asset',
  asset: imageAsset,
  picked: false,
  updating: false,
}
const fileAsset = mockS3FileAsset as S3Asset
const fileItem: AssetItem = {
  _type: 'asset',
  asset: fileAsset,
  picked: false,
  updating: false,
}

describe('AssetMetadata', () => {
  it('renders user-facing metadata fields for image assets', () => {
    renderWithStore(<AssetMetadata asset={imageAsset} item={imageItem} />)

    expect(screen.getByText('MIME type')).toBeInTheDocument()
    expect(screen.getByText(mockS3ImageAsset.mimeType)).toBeInTheDocument()
    expect(screen.getByText('Extension')).toBeInTheDocument()
    expect(screen.getByText('JPG')).toBeInTheDocument()
    expect(screen.getByText('Dimensions')).toBeInTheDocument()
    expect(screen.getByText('800x600px')).toBeInTheDocument()
  })

  it('triggers download with the generated asset url', async () => {
    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: vi.fn(() => 'blob://placeholder'),
      })
    }
    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: vi.fn(),
      })
    }
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://download')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        blob: vi.fn().mockResolvedValue(new Blob(['bytes'])),
      } as unknown as Response)

    renderWithStore(<AssetMetadata asset={imageAsset} item={imageItem} />)

    await user.click(screen.getByRole('button', {name: 'Download'}))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('asset-image-1-800x600.jpg'),
      expect.objectContaining({method: 'GET'}),
    )
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob))
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob://download')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledWith()
    const anchors = appendSpy.mock.calls
      .map(([node]) => node)
      .filter((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement)

    expect(anchors.at(-1)?.href).toBe('blob://download')
  })

  it('disables actions when no mutable item state is available', () => {
    renderWithStore(<AssetMetadata asset={imageAsset} />)

    expect(screen.getByRole('button', {name: 'Download'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Copy URL'})).toBeDisabled()
  })

  it('does not render dimensions row for non-image/video assets', () => {
    renderWithStore(<AssetMetadata asset={fileAsset} item={fileItem} />)

    expect(screen.queryByText('Dimensions')).not.toBeInTheDocument()
  })
})
