import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {Dialog} from '../Dialog'

describe('Dialog', () => {
  it('forces fixed positioning while preserving dialog content and props', () => {
    renderWithStore(
      <Dialog id="dialog-1" onClose={vi.fn()} title="Dialog title">
        <div>Dialog content</div>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveStyle({position: 'fixed'})
    expect(dialog).toHaveAttribute('title', 'Dialog title')
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
  })
})
