import {render, screen} from '@testing-library/react'
import {of} from 'rxjs'

import {WithReferencedAsset} from '../WithReferencedAsset'

const useObservableMock = vi.fn()

vi.mock('react-rx', () => ({
  useObservable: (...args: unknown[]) => useObservableMock(...args),
}))

type ReferencedAsset = {name: string}

describe('WithReferencedAsset', () => {
  it('renders wait placeholder while asset is not available', () => {
    useObservableMock.mockReturnValueOnce(undefined)

    const observeAsset = vi.fn(() => of({name: 'Image 1'} as ReferencedAsset))

    render(
      <WithReferencedAsset
        reference={{_type: 'reference', _ref: 'asset-1'}}
        observeAsset={observeAsset}
        waitPlaceholder={<span>Loading asset...</span>}
      >
        {(asset: ReferencedAsset) => <span>{asset.name}</span>}
      </WithReferencedAsset>,
    )

    expect(screen.getByText('Loading asset...')).toBeInTheDocument()
    expect(observeAsset).toHaveBeenCalledTimes(1)
    expect(observeAsset).toHaveBeenCalledWith('asset-1')
  })

  it('renders children when referenced asset is resolved', () => {
    useObservableMock.mockReturnValueOnce({name: 'Image 1'})

    render(
      <WithReferencedAsset
        reference={{_type: 'reference', _ref: 'asset-1'}}
        observeAsset={() => of({name: 'Image 1'})}
      >
        {(asset: ReferencedAsset) => <span>{asset.name}</span>}
      </WithReferencedAsset>,
    )

    expect(screen.getByText('Image 1')).toBeInTheDocument()
  })
})
