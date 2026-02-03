import {useEffect, useState, type FC, type SyntheticEvent} from 'react'

import {MediaBrowser} from '..'
import type {S3AssetSourceComponentProps} from '../../types'
import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import {useKeyPress} from '../../hooks'
import {Box, Portal, PortalProvider, useLayer} from '@sanity/ui'

const useRootPortalElement = () => {
  const [container] = useState(() => document.createElement('div'))

  useEffect(() => {
    container.classList.add('media-portal')

    document.body.appendChild(container)
    return () => {
      document.body.removeChild(container)
    }
  }, [container])

  return container
}

export const S3AssetSource: FC<S3AssetSourceComponentProps> = (props) => {
  const {action = 'select', onClose} = props

  const portalElement = useRootPortalElement()

  // Get current Sanity document
  const currentDocument = useFormValue([]) as SanityDocument

  // Close on escape key press
  useKeyPress('escape', onClose)

  // Stop propagation and prevent document mouse events from firing.
  // This is a bit of a hack to make this work with `editModal = 'popover'` and prevent Sanity's <Popover /> component from
  // prematurely closing, as it attaches events on `document` to detect outside clicks.
  const handleStopPropagation = (event: SyntheticEvent) => {
    event.nativeEvent.stopImmediatePropagation()
    event.stopPropagation()
  }

  const {zIndex} = useLayer()

  if (action === 'select') {
    return (
      <PortalProvider element={portalElement}>
        <Portal>
          <Box
            onDragEnter={handleStopPropagation}
            onDragLeave={handleStopPropagation}
            onDragOver={handleStopPropagation}
            onDrop={handleStopPropagation}
            onMouseUp={handleStopPropagation}
            style={{
              bottom: 0,
              height: 'auto',
              left: 0,
              position: 'fixed',
              top: 0,
              width: '100%',
              zIndex,
            }}
          >
            <MediaBrowser document={currentDocument} {...props} />
          </Box>
        </Portal>
      </PortalProvider>
    )
  }

  return null
}
