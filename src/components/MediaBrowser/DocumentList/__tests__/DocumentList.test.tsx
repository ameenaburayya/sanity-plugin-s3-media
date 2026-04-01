import type {SanityDocument} from '@sanity/client'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithStore} from 'src/test/renderWithStore'

import {DocumentList} from '../DocumentList'

const user = userEvent.setup()
const intentClickMock = vi.fn()

vi.mock('sanity/router', async () => {
  const actual = await vi.importActual<Record<string, object>>('sanity/router')

  return {
    ...actual,
    useIntentLink: () => ({
      href: '#',
      onClick: intentClickMock,
    }),
  }
})

const documents = [
  {_id: 'post-1', _type: 'post', title: 'First post'},
  {_id: 'post-2', _type: 'post', title: 'Second post'},
]

describe('DocumentList', () => {
  it('shows loading copy while documents are being resolved', () => {
    renderWithStore(<DocumentList documents={[]} isLoading />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows an empty state when no documents reference the asset', () => {
    renderWithStore(<DocumentList documents={[]} isLoading={false} />)

    expect(screen.getByText('No documents are referencing this asset')).toBeInTheDocument()
  })

  it('renders referring documents and opens intent link on click', async () => {
    renderWithStore(<DocumentList documents={documents as unknown as SanityDocument[]} isLoading={false} />)

    await user.click(screen.getByRole('button', {name: 'First post'}))

    expect(screen.getByRole('button', {name: 'Second post'})).toBeInTheDocument()
    expect(intentClickMock).toHaveBeenCalledTimes(1)
    expect(intentClickMock).toHaveBeenCalledWith(expect.any(Object))
  })
})
