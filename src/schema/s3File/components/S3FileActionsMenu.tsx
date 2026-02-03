import {BinaryDocumentIcon} from '@sanity/icons'
import {
  Box,
  Card,
  Flex,
  Menu,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
  useGlobalKeyDown,
} from '@sanity/ui'
import {type FC, type ReactNode, useCallback, useEffect, useState} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'

import {formatBytes} from '../../../utils'

type S3FileActionsMenuProps = {
  children: ReactNode
  size: number
  originalFilename: string
  onClick?: () => void
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export const S3FileActionsMenu: FC<S3FileActionsMenuProps> = (props) => {
  const {originalFilename, size, children, muted, disabled, onClick, isMenuOpen, onMenuOpen} = props
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(true), [onMenuOpen])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          buttonElement?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, buttonElement]
    )
  )

  // Close menu when clicking outside of it
  // Not when clicking on the button
  useClickOutsideEvent(
    (event) => {
      if (!buttonElement?.contains(event.target as Node)) {
        onMenuOpen(false)
      }
    },
    () => [menuElement]
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

  return (
    <Flex wrap="nowrap" justify="space-between" align="center">
      <Card
        as={muted || disabled ? undefined : 'button'}
        radius={2}
        padding={2}
        tone="inherit"
        onClick={onClick}
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
              {originalFilename}
            </Text>
            <Text size={1} muted>
              {formatBytes(size)}
            </Text>
          </Stack>
        </Flex>
      </Card>

      <Box padding={2}>
        <Flex justify="center" gap={2}>
          {/* Using a customized Popover instead of MenuButton because a MenuButton will close on click
     and break replacing an uploaded file. */}
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
        </Flex>
      </Box>
    </Flex>
  )
}
