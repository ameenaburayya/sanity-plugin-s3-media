import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {type FC, type PropsWithChildren} from 'react'
import {useDispatch} from 'react-redux'

import {dialogActions} from '../../../modules'
import type {DialogConfirmProps} from '../../../types/browser'
import {Dialog} from '../Dialog'

export const DialogConfirm: FC<PropsWithChildren<{dialog: DialogConfirmProps}>> = (props) => {
  const {children, dialog} = props

  // Redux
  const dispatch = useDispatch()

  // Callbacks
  const handleClose = () => {
    dispatch(dialogActions.remove({id: dialog?.id}))
  }

  const handleConfirm = () => {
    // Close target dialog, if provided
    if (dialog?.closeDialogId) {
      dispatch(dialogActions.remove({id: dialog?.closeDialogId}))
    }

    if (dialog?.confirmCallbackAction) {
      dispatch(dialog.confirmCallbackAction)
    }

    // Close self
    handleClose()
  }

  return (
    <Dialog
      animate
      footer={
        <Box padding={3}>
          <Flex justify="space-between">
            <Button fontSize={1} mode="bleed" onClick={handleClose} text="Cancel" />
            <Button
              fontSize={1}
              onClick={handleConfirm}
              text={dialog?.confirmText}
              tone={dialog?.tone}
            />
          </Flex>
        </Box>
      }
      header={
        <Flex align="center">
          <Box paddingX={1}>
            <WarningOutlineIcon />
          </Box>
          <Box marginLeft={2}>{dialog?.headerTitle}</Box>
        </Flex>
      }
      id="confirm"
      onClose={handleClose}
      width={1}
    >
      <Box paddingX={4} paddingY={4}>
        <Stack space={3}>
          {dialog?.title && <Text size={1}>{dialog.title}</Text>}
          {dialog?.description && (
            <Text muted size={1}>
              <em>{dialog.description}</em>
            </Text>
          )}
        </Stack>
      </Box>

      {children}
    </Dialog>
  )
}
