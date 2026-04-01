import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'
import type {S3AssetSource} from 'src/types'

import {BrowserButton} from '../BrowserButton'

const user = userEvent.setup()
const createAssetSource = (name: string, title?: string): S3AssetSource =>
  ({
    name,
    title,
    component: () => null,
  }) as S3AssetSource

describe('BrowserButton', () => {
  it('renders nothing when there are no asset sources', () => {
    renderWithStore(
      <BrowserButton
        id="file"
        assetSources={[]}
        readOnly={false}
        setSelectedAssetSource={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', {name: 'Browse'})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: 'Browse'}),
    ).not.toBeInTheDocument()
  })

  it('renders single source button and selects source on click', async () => {
    const setSelectedAssetSource = vi.fn()
    const source = createAssetSource('library')

    renderWithStore(
      <BrowserButton
        id="file"
        assetSources={[source]}
        readOnly={false}
        setSelectedAssetSource={setSelectedAssetSource}
      />,
    )

    await user.click(screen.getByRole('button', {name: 'Browse'}))

    expect(setSelectedAssetSource).toHaveBeenCalledTimes(1)
    expect(setSelectedAssetSource).toHaveBeenCalledWith(source)
  })

  it('disables single source button when read only', () => {
    const source = createAssetSource('library')

    renderWithStore(
      <BrowserButton id="file" assetSources={[source]} readOnly setSelectedAssetSource={vi.fn()} />,
    )

    expect(screen.getByRole('button', {name: 'Browse'})).toBeDisabled()
  })

  it('renders source picker menu when multiple sources are available', async () => {
    const setSelectedAssetSource = vi.fn()
    const first = createAssetSource('library', 'Main library')
    const second = createAssetSource('archive', 'Archive')

    renderWithStore(
      <BrowserButton
        id="file"
        assetSources={[first, second]}
        readOnly={false}
        setSelectedAssetSource={setSelectedAssetSource}
      />,
    )

    await user.click(screen.getByRole('button', {name: 'Browse'}))
    await user.click(screen.getByRole('menuitem', {name: 'Archive', hidden: true}))

    expect(setSelectedAssetSource).toHaveBeenCalledTimes(1)
    expect(setSelectedAssetSource).toHaveBeenCalledWith(second)
  })
})
