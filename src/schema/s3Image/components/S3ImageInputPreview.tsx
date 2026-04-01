import {WarningOutlineIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {type FC, memo, useCallback, useState} from 'react'
import {LoadingBlock} from 'sanity'
import {S3AssetType} from 'sanity-plugin-s3-media-types'

import {useS3MediaContext} from '../../../contexts'
import {type S3ImageInputProps} from '../types'
import {ErrorIconWrapper, FlexOverlay, Overlay, RatioBox} from './S3ImagePreview.styled'

const LoadingOverlay = () => {
  return (
    <Overlay padding={3} tone="transparent">
      <FlexOverlay direction="column" align="center" justify="center">
        <LoadingBlock showText />
      </FlexOverlay>
    </Overlay>
  )
}

const AccessWarningOverlay = () => {
  return (
    <Overlay padding={3} tone="critical" border>
      <FlexOverlay direction="column" align="center" justify="center" gap={2}>
        <ErrorIconWrapper>
          <WarningOutlineIcon />
        </ErrorIconWrapper>
        <Text muted size={1}>
          Could not load image. This may be due to access restrictions.
        </Text>
      </FlexOverlay>
    </Overlay>
  )
}

type S3ImageInputPreviewProps = Pick<S3ImageInputProps, 'readOnly' | 'value'>

export const S3ImageInputPreview: FC<S3ImageInputPreviewProps> = memo((props) => {
  const {readOnly, value} = props

  const {buildAssetUrl} = useS3MediaContext()

  const url = value?.asset?._ref
    ? buildAssetUrl({assetId: value?.asset?._ref, assetType: S3AssetType.IMAGE})
    : null

  const [isLoaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const onLoadChange = useCallback(() => {
    setLoaded(true)
    setHasError(false)
  }, [])

  const onErrorChange = useCallback(() => {
    setHasError(true)
    setLoaded(false)
  }, [])

  const showAccessWarning = hasError
  const showLoading = !isLoaded && !showAccessWarning

  if (!url) {
    return null
  }

  return (
    <RatioBox readOnly={readOnly} tone="transparent" data-testid="s3-image-input-preview">
      {showAccessWarning && <AccessWarningOverlay />}
      {showLoading && <LoadingOverlay />}

      {url && (
        <img
          src={url}
          alt="Preview of uploaded image"
          onLoad={onLoadChange}
          onError={onErrorChange}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </RatioBox>
  )
})

S3ImageInputPreview.displayName = 'S3ImageInputPreview'
