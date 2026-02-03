import {
  Inline,
  Menu,
  Popover,
  Skeleton,
  TooltipDelayGroupProvider,
  useClickOutsideEvent,
  useGlobalKeyDown,
} from '@sanity/ui'
import {type FC, type ReactNode, useCallback, useEffect, useState} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'
import {styled} from 'styled-components'

const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
`

export const S3ImageActionsMenuWaitPlaceholder = () => (
  <MenuActionsWrapper padding={2}>
    <Skeleton style={{width: '25px', height: '25px'}} animated />
  </MenuActionsWrapper>
)

interface S3ImageActionsMenuProps {
  children: ReactNode
  setMenuButtonElement: (element: HTMLButtonElement | null) => void
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export const S3ImageActionsMenu: FC<S3ImageActionsMenuProps> = (props) => {
  const {children, setMenuButtonElement, onMenuOpen, isMenuOpen} = props

  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(!isMenuOpen), [onMenuOpen, isMenuOpen])

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

  const setOptionsButtonRef = useCallback(
    (el: HTMLButtonElement | null) => {
      // Pass the button element to the parent component so that it can focus it when e.g. closing dialogs
      // setMenuButtonElement(el)
      // Set focus back on the button when closing the menu
      // setButtonElement(el)
    },
    [setMenuButtonElement]
  )

  // When the popover is open, focus the menu to enable keyboard navigation
  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  const {t} = useTranslation()
  return (
    <TooltipDelayGroupProvider delay={{open: 400}}>
      <MenuActionsWrapper data-buttons space={1} padding={2}>
        <Popover
          id="image-actions-menu"
          content={<Menu ref={setMenuElement}>{children}</Menu>}
          portal
          open={isMenuOpen}
          constrainSize
        >
          <ContextMenuButton
            aria-label={t('inputs.image.actions-menu.options.aria-label')}
            mode="ghost"
            onClick={handleClick}
            ref={setOptionsButtonRef}
          />
        </Popover>
      </MenuActionsWrapper>
    </TooltipDelayGroupProvider>
  )
}
