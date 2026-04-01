import {CopyIcon, DownloadIcon, ResetIcon} from '@sanity/icons'
import {MenuDivider, useToast} from '@sanity/ui'
import {type FC, type MouseEventHandler, type ReactNode, useCallback} from 'react'

import {downloadAsset} from '../../utils'
import {MenuItem} from './MenuItem'

interface ActionsMenuProps {
  browse: ReactNode
  readOnly?: boolean
  onReset: MouseEventHandler<HTMLDivElement>
  url?: string
  upload: ReactNode
}

export const ActionsMenu: FC<ActionsMenuProps> = (props) => {
  const {onReset, readOnly, browse, url, upload} = props

  const {push: pushToast} = useToast()

  const handleCopyURL = useCallback(() => {
    void navigator.clipboard.writeText(url || '')

    pushToast({
      closable: true,
      status: 'success',
      title: 'The URL is copied to the clipboard',
    })
  }, [url, pushToast])

  return (
    <>
      {upload}
      {upload && browse && <MenuDivider />}
      {browse}

      {url && <MenuDivider />}

      {url && <MenuItem icon={DownloadIcon} text="Download" onClick={() => downloadAsset(url)} />}
      {url && <MenuItem icon={CopyIcon} text="Copy URL" onClick={handleCopyURL} />}

      <MenuDivider />

      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text="Clear field"
        onClick={onReset}
        disabled={readOnly}
      />
    </>
  )
}
