import {CopyIcon, DownloadIcon, ResetIcon} from '@sanity/icons'
import {MenuDivider, useToast} from '@sanity/ui'
import {type FC, type MouseEventHandler, type ReactNode, useCallback} from 'react'
import {useTranslation} from 'sanity'

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
  const {t} = useTranslation()

  const handleCopyURL = useCallback(() => {
    void navigator.clipboard.writeText(url || '')

    pushToast({
      closable: true,
      status: 'success',
      title: t('inputs.files.common.actions-menu.notification.url-copied'),
    })
  }, [url, pushToast, t])

  return (
    <>
      {upload}
      {upload && browse && <MenuDivider />}
      {browse}

      {url && <MenuDivider />}

      {url && (
        <MenuItem
          as="a"
          icon={DownloadIcon}
          text={t('inputs.files.common.actions-menu.download.label')}
          href={url}
          download
        />
      )}
      {url && (
        <MenuItem
          icon={CopyIcon}
          text={t('inputs.files.common.actions-menu.copy-url.label')}
          onClick={handleCopyURL}
        />
      )}

      <MenuDivider />

      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text={t('inputs.files.common.actions-menu.clear-field.label')}
        onClick={onReset}
        disabled={readOnly}
      />
    </>
  )
}
