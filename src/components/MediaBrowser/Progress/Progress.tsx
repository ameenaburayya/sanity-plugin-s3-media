import {Box} from '@sanity/ui'
import {useNProgress} from '@tanem/react-nprogress'
import type {FC} from 'react'

type ProgressProps = {
  loading?: boolean
}

export const Progress: FC<ProgressProps> = (props) => {
  const {loading} = props

  const {animationDuration, isFinished, progress} = useNProgress({
    animationDuration: 300,
    isAnimating: loading,
  })

  return (
    <Box
      data-testid="progress-wrapper"
      style={{
        opacity: isFinished ? 0 : 1,
        transition: `opacity ${animationDuration}ms linear`,
      }}
    >
      <Box
        data-testid="progress-bar"
        style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.5)',
          position: 'absolute',
          left: 0,
          top: 0,
          transition: `width ${animationDuration}ms linear`,
          width: `${progress * 100}%`,
        }}
      />
    </Box>
  )
}
