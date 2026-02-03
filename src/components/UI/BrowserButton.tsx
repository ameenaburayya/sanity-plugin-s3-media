import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {Menu, MenuButton} from '@sanity/ui'
import {startCase} from 'lodash'
import {type FC, useCallback} from 'react'
import {useTranslation} from 'sanity'

import {Button} from './Button'
import {MenuItem} from './MenuItem'
import type {S3AssetSource} from '../../types'

type BrowserButtonProps = {
  id: string
  assetSources: S3AssetSource[]
  readOnly: boolean | undefined
  setSelectedAssetSource: (assetSource: S3AssetSource | null) => void
}

export const BrowserButton: FC<BrowserButtonProps> = (props) => {
  const {assetSources, readOnly, id, setSelectedAssetSource} = props
  const {t} = useTranslation()

  const handleSelectAssetFromSource = useCallback(
    (assetSource: S3AssetSource) => {
      setSelectedAssetSource(assetSource)
    },
    [setSelectedAssetSource]
  )

  if (assetSources.length === 0) return null

  if (assetSources.length > 1 && !readOnly) {
    return (
      <MenuButton
        id={`${id}_assetFileButton`}
        button={
          <Button
            mode="bleed"
            text={t('inputs.file.multi-browse-button.text')}
            icon={SearchIcon}
            iconRight={ChevronDownIcon}
          />
        }
        menu={
          <Menu>
            {assetSources.map((assetSource) => {
              return (
                <MenuItem
                  key={assetSource.name}
                  text={assetSource.title || startCase(assetSource.name)}
                  onClick={() => handleSelectAssetFromSource(assetSource)}
                  icon={assetSource.icon || ImageIcon}
                />
              )
            })}
          </Menu>
        }
      />
    )
  }

  return (
    <Button
      text={t('inputs.file.browse-button.text')}
      icon={SearchIcon}
      mode="bleed"
      onClick={() => handleSelectAssetFromSource(assetSources[0])}
      disabled={readOnly}
    />
  )
}
