import {Box} from '@sanity/ui'
import React, {type CSSProperties, type FC, type FocusEvent, useCallback, useMemo} from 'react'
import {type UploadState} from 'sanity'
import {ChangeIndicator, type InputOnSelectFileFunctionProps, type InputProps} from 'sanity'

import {UploadTargetCard, UploadWarning} from '../../../components'
import {useS3MediaOptionsContext} from '../../../contexts'
import {type S3ImageInputProps} from '../types'
import type {S3AssetSource} from '../../../types'
import {tryGetS3ImageDimensions} from '../../../utils'

const ASSET_FIELD_PATH = ['asset'] as const

type S3ImageInputAssetProps = Pick<S3ImageInputProps, 'elementProps' | 'schemaType' | 'value'> & {
  assetSources: S3AssetSource[]
  handleClearUploadState: () => void
  onSelectFile: (assetSource: S3AssetSource, file: File) => void
  inputProps: Omit<InputProps, 'renderDefault'>
  isStale: boolean
  readOnly: boolean | undefined
  renderAssetMenu: () => React.JSX.Element
  renderPreview: () => React.JSX.Element
  renderUploadPlaceholder: () => React.JSX.Element
  renderUploadState: (uploadState: UploadState) => React.JSX.Element
  selectedAssetSource: S3AssetSource | null
}

export const S3ImageInputAsset: FC<S3ImageInputAssetProps> = (props) => {
  const {
    assetSources,
    elementProps,
    handleClearUploadState,
    onSelectFile,
    inputProps,
    isStale,
    readOnly,
    renderAssetMenu,
    renderPreview,
    renderUploadPlaceholder,
    renderUploadState,
    schemaType,
    value,
  } = props

  const {directUploads} = useS3MediaOptionsContext()

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)
  const path = useMemo(() => inputProps.path.concat(ASSET_FIELD_PATH), [inputProps.path])

  const customProperties = useMemo(() => {
    const {width = 0, height = 0} = value?.asset ? tryGetS3ImageDimensions(value.asset) || {} : {}
    return {'--image-width': width, '--image-height': height} as CSSProperties
  }, [value])

  const handleSelectFile = useCallback(
    ({
      assetSource,
      file,
    }: Omit<InputOnSelectFileFunctionProps, 'assetSource'> & {assetSource: S3AssetSource}) => {
      onSelectFile(assetSource, file)
    },
    [onSelectFile]
  )

  const handleFileTargetFocus = useCallback(
    (event: FocusEvent) => {
      // We want to handle focus when the file target element *itself* receives
      // focus, not when an interactive child element receives focus. Since React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (
        event.currentTarget === event.target &&
        event.currentTarget === elementProps.ref?.current
      ) {
        inputProps.elementProps.onFocus(event)
      }
    },
    [inputProps, elementProps.ref?.current]
  )

  return (
    <div style={customProperties}>
      {isStale && (
        <Box marginBottom={2}>
          <UploadWarning onClearStale={handleClearUploadState} />
        </Box>
      )}
      <ChangeIndicator path={path} hasFocus={!!inputProps.focused} isChanged={inputProps.changed}>
        {value?._upload ? (
          renderUploadState(value._upload)
        ) : (
          <UploadTargetCard
            {...elementProps}
            assetSources={assetSources}
            border={hasValueOrUpload}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onSelectFile={handleSelectFile}
            radius={2}
            sizing="border"
            tabIndex={0}
            directUploads={directUploads}
            schemaType={schemaType}
          >
            {!value?.asset && renderUploadPlaceholder()}
            {!value?._upload && value?.asset && (
              <div style={{position: 'relative'}}>
                {renderPreview()}
                {renderAssetMenu()}
              </div>
            )}
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </div>
  )
}
