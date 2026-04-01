import {screen} from '@testing-library/react'
import {renderWithStore} from 'src/test/renderWithStore'

import {S3FileSkeleton} from '../S3FileSkeleton'

describe('S3FileSkeleton', () => {
  it('renders primary and secondary skeleton lines', () => {
    renderWithStore(<S3FileSkeleton />)

    expect(screen.getByTestId('s3-file-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-icon')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-primary')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-secondary')).toBeInTheDocument()
  })
})
