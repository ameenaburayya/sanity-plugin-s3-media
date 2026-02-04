import {BinaryDocumentIcon} from '@sanity/icons'
import {
  Card,
  Flex,
  Inline,
  Menu,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
  useGlobalKeyDown,
} from '@sanity/ui'
import {type FC, type ReactNode, useCallback, useEffect, useState} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {useS3MediaContext} from '../../../contexts'
import {S3AssetType, type S3FileAsset} from '../../../types'
import {formatBytes} from '../../../utils'

const MenuActionsWrapper = styled(Inline)<{$isAbsolute?: boolean}>`
  ${({$isAbsolute}) =>
    $isAbsolute &&
    `
    position: absolute;
    top: 0;
    right: 0;
  `}
`

type S3FileActionsMenuProps = {
  children: ReactNode
  fileAsset: S3FileAsset
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export const S3FileActionsMenu: FC<S3FileActionsMenuProps> = (props) => {
  const {children, muted, disabled, fileAsset, isMenuOpen, onMenuOpen} = props
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const {originalFilename, extension, _id: assetId, size, mimeType} = fileAsset

  const filename = originalFilename || `${assetId}.${extension}`

  const handleClick = useCallback(() => onMenuOpen(true), [onMenuOpen])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          buttonElement?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, buttonElement],
    ),
  )

  // Close menu when clicking outside of it
  // Not when clicking on the button
  useClickOutsideEvent(
    (event) => {
      if (!buttonElement?.contains(event.target as Node)) {
        onMenuOpen(false)
      }
    },
    () => [menuElement],
  )

  const setOptionsButtonRef = useCallback((el: HTMLButtonElement | null) => {
    // Set focus back on the button when closing the menu
    setButtonElement(el)
  }, [])

  // When the popover is open, focus the menu to enable keyboard navigation
  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  const {t} = useTranslation()

  const {buildAssetUrl} = useS3MediaContext()

  const assetUrl = buildAssetUrl({assetType: S3AssetType.FILE, assetId})

  const isAudioFile = mimeType.search('audio') === 0
  const isVideoFile = mimeType.search('video') === 0

  const renderPreview = useCallback(() => {
    if (isVideoFile || isAudioFile) {
      return (
        <Flex align="center" justify="center" style={{height: '300px', width: '100%'}}>
          {isVideoFile ? (
            <video
              controls
              autoPlay
              loop
              src={assetUrl}
              style={{
                height: '100%',
                width: '100%',
              }}
            />
          ) : null}

          {isAudioFile ? <audio controls src={assetUrl} style={{width: '100%'}} /> : null}
        </Flex>
      )
    }

    return (
      <Card
        as={muted || disabled ? undefined : 'button'}
        radius={2}
        padding={2}
        tone="inherit"
        flex={1}
      >
        <Flex wrap="nowrap" align="center">
          <Card padding={3} tone="transparent" shadow={1} radius={1}>
            <Text muted={muted}>
              <BinaryDocumentIcon />
            </Text>
          </Card>

          <Stack flex={1} space={2} marginLeft={3}>
            <Text size={1} textOverflow="ellipsis" muted={muted} weight="medium">
              {filename}
            </Text>

            <Text size={1} muted>
              {formatBytes(size)}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }, [disabled, filename, isVideoFile, isAudioFile, muted, size, assetUrl])

  return (
    <Flex wrap="nowrap" justify="space-between" align="center">
      {renderPreview()}

      <MenuActionsWrapper padding={2} $isAbsolute={isAudioFile || isVideoFile}>
        <Popover
          content={<Menu ref={setMenuElement}>{children}</Menu>}
          id="file-actions-menu"
          portal
          open={isMenuOpen}
          constrainSize
        >
          <ContextMenuButton
            aria-label={t('inputs.file.actions-menu.file-options.aria-label')}
            onClick={handleClick}
            ref={setOptionsButtonRef}
          />
        </Popover>
      </MenuActionsWrapper>
    </Flex>
  )
}
