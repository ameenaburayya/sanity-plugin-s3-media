import type {FC} from 'react'

import {useTypedSelector} from '../../../hooks'
import {DialogAssetEdit} from '../DialogAssetEdit'
import {DialogConfirm} from '../DialogConfirm'
import type {Dialog} from '../../../types/browser'

export const Dialogs: FC = () => {
  // Redux
  const currentDialogs = useTypedSelector((state) => state.dialog.items)

  const renderDialogs = (dialogs: Dialog[], index: number) => {
    if (dialogs.length === 0 || index >= dialogs.length) {
      return null
    }

    const dialog = dialogs[index]
    const childDialogs = renderDialogs(dialogs, index + 1)

    if (dialog.type === 'assetEdit') {
      return (
        <DialogAssetEdit dialog={dialog} key={index}>
          {childDialogs}
        </DialogAssetEdit>
      )
    }

    if (dialog.type === 'confirm') {
      return (
        <DialogConfirm dialog={dialog} key={index}>
          {childDialogs}
        </DialogConfirm>
      )
    }

    return null
  }

  return renderDialogs(currentDialogs, 0)
}
