import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {ErrorIconWrapper, FlexOverlay, Overlay, RatioBox} from '../S3ImagePreview.styled'

describe('S3ImagePreview.styled', () => {
  it('renders ratio container content', () => {
    renderWithStore(
      <RatioBox data-testid="ratio-box" tone="transparent">
        <img alt="Preview" src="https://cdn.example.com/images/asset-1" />
      </RatioBox>,
    )

    expect(screen.getByTestId('ratio-box')).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Preview'})).toBeInTheDocument()
  })

  it('renders overlay wrappers and icon container', () => {
    renderWithStore(
      <Overlay data-testid="overlay" tone="transparent">
        <FlexOverlay data-testid="flex-overlay">
          <ErrorIconWrapper data-testid="error-icon">!</ErrorIconWrapper>
        </FlexOverlay>
      </Overlay>,
    )

    expect(screen.getByTestId('overlay')).toBeInTheDocument()
    expect(screen.getByTestId('flex-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('error-icon')).toHaveTextContent('!')
  })
})
