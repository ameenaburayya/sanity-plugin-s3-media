import {CheckmarkCircleIcon, EditIcon, WarningFilledIcon} from '@sanity/icons'
import {
  Box,
  Card,
  Checkbox,
  Container,
  Flex,
  Spinner,
  Text,
  type Theme,
  type ThemeColorSchemeKey,
  Tooltip,
} from '@sanity/ui'
import {type FC, memo, type MouseEvent, type RefObject} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'
import {css, styled} from 'styled-components'

import {useS3MediaContext} from '../../../contexts'
import {useAssetSourceActions} from '../../../contexts/S3AssetSourceDispatchContext'
import {useKeyPress, useTypedSelector} from '../../../hooks'
import {assetsActions, dialogActions, selectAssetById} from '../../../modules'
import {S3AssetType} from '../../../types'
import {getSchemeColor, isS3FileAsset, isS3ImageAsset} from '../../../utils'
import {PANEL_HEIGHT} from '../constants'
import {FileIcon} from '../FileIcon'
import {Image} from '../Image'

type CardAssetProps = {
  id: string
  selected: boolean
}

const CardWrapper = styled(Flex)`
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
`

const CardContainer = styled(Flex)<{$picked?: boolean; theme: Theme; $updating?: boolean}>(({
  $picked,
  theme,
  $updating,
}) => {
  return css`
    border: 1px solid transparent;
    height: 100%;
    pointer-events: ${$updating ? 'none' : 'auto'};
    position: relative;
    transition: all 300ms;
    user-select: none;
    width: 100%;

    border: ${$picked
      ? `1px solid ${theme.sanity.color.spot.orange} !important`
      : '1px solid inherit'};

    ${!$updating &&
    css`
      @media (hover: hover) and (pointer: fine) {
        &:hover {
          border: 1px solid var(--card-border-color);
        }
      }
    `}
  `
})

const ContextActionContainer = styled<typeof Flex, {$scheme: ThemeColorSchemeKey}>(Flex)(({
  $scheme,
}) => {
  return css`
    cursor: pointer;
    height: ${PANEL_HEIGHT}px;
    transition: all 300ms;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${getSchemeColor($scheme, 'bg')};
      }
    }
  `
})

const BaseCardAsset: FC<CardAssetProps> = (props) => {
  const {id, selected} = props

  const scheme = useColorSchemeValue()

  // Refs
  const shiftPressed: RefObject<boolean> = useKeyPress('shift')

  // Redux
  const dispatch = useDispatch()
  const lastPicked = useTypedSelector((state) => state.assets.lastPicked)
  const item = useTypedSelector((state) => selectAssetById(state, id))

  const asset = item?.asset
  const error = item?.error
  const picked = item?.picked
  const updating = item?.updating

  const {onSelect} = useAssetSourceActions()

  const {buildAssetUrl} = useS3MediaContext()

  // Short circuit if no asset is available
  if (!asset) {
    return null
  }

  // Callbacks
  const handleAssetClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (onSelect) {
      onSelect([
        {
          kind: 'assetDocumentId',
          value: asset._id,
        },
      ])
    } else if (shiftPressed.current) {
      if (picked) {
        dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
      } else {
        dispatch(assetsActions.pickRange({startId: lastPicked || asset._id, endId: asset._id}))
      }
    } else {
      dispatch(dialogActions.showAssetEdit({assetId: asset._id}))
    }
  }

  const handleContextActionClick = (e: MouseEvent) => {
    e.stopPropagation()

    if (onSelect) {
      dispatch(dialogActions.showAssetEdit({assetId: asset._id}))
    } else if (shiftPressed.current && !picked) {
      dispatch(assetsActions.pickRange({startId: lastPicked || asset._id, endId: asset._id}))
    } else {
      dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
    }
  }

  const opacityContainer = updating ? 0.5 : 1
  const opacityPreview = selected || updating ? 0.25 : 1

  return (
    <CardWrapper padding={1}>
      <CardContainer direction="column" $picked={picked} $updating={item.updating}>
        {/* Image */}
        <Box
          flex={1}
          style={{
            cursor: selected ? 'default' : 'pointer',
            position: 'relative',
          }}
        >
          <div onClick={handleAssetClick} style={{height: '100%', opacity: opacityPreview}}>
            {/* File icon */}
            {isS3FileAsset(asset) && (
              <FileIcon asset={asset} extension={asset.extension} width="80px" />
            )}

            {/* Image */}
            {isS3ImageAsset(asset) && (
              <Image
                draggable={false}
                $scheme={scheme}
                $showCheckerboard
                src={buildAssetUrl({assetId: asset._id, assetType: S3AssetType.IMAGE})}
                style={{
                  transition: 'opacity 1000ms',
                }}
              />
            )}
          </div>

          {/* Selected check icon */}
          {selected && !updating && (
            <Flex
              align="center"
              justify="center"
              style={{
                height: '100%',
                left: 0,
                opacity: opacityContainer,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              <Text size={2}>
                <CheckmarkCircleIcon />
              </Text>
            </Flex>
          )}

          {/* Spinner */}
          {updating && (
            <Flex
              align="center"
              justify="center"
              style={{
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              <Spinner />
            </Flex>
          )}
        </Box>

        {/* Footer */}
        <ContextActionContainer
          align="center"
          onClick={handleContextActionClick}
          paddingX={1}
          $scheme={scheme}
          style={{opacity: opacityContainer}}
        >
          {onSelect ? (
            <EditIcon
              style={{
                flexShrink: 0,
                opacity: 0.5,
              }}
            />
          ) : (
            <Checkbox
              checked={picked}
              readOnly
              style={{
                flexShrink: 0,
                pointerEvents: 'none',
                transform: 'scale(0.8)',
              }}
            />
          )}

          <Box marginLeft={2}>
            <Text muted size={0} textOverflow="ellipsis">
              {asset.originalFilename}
            </Text>
          </Box>
        </ContextActionContainer>

        {/* Error button */}
        {error && (
          <Card
            tone="critical"
            padding={3}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            <Tooltip
              animate
              content={
                <Container padding={2} width={0}>
                  <Text size={1}>{error}</Text>
                </Container>
              }
              placement="left"
              portal
            >
              <Text size={1}>
                <WarningFilledIcon color="critical" />
              </Text>
            </Tooltip>
          </Card>
        )}
      </CardContainer>
    </CardWrapper>
  )
}

export const CardAsset = memo(BaseCardAsset)
