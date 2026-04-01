import {render} from '@testing-library/react'

import {GlobalStyle} from '../GlobalStyle'

describe('GlobalStyle', () => {
  it('injects media browser scrollbar and dialog overrides into the document styles', () => {
    render(
      <>
        <GlobalStyle />
        <div className="media__custom-scrollbar">content</div>
      </>,
    )

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((tag) => tag.textContent || '')
      .join('\n')

    expect(css).toContain('.media__custom-scrollbar')
    expect(css).toContain('div[data-ui="Dialog"]')
    expect(css).toContain('div[data-ui="Box"]')
  })
})
