import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {get, startCase} from 'lodash'
import {type FC, type ReactNode, useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {type Reference, useTranslation} from 'sanity'

import {ActionsMenu, FileInputMenuItem, MenuItem, UploadDropDownMenu} from '../../../components'
import {useS3MediaContext, useS3MediaOptionsContext} from '../../../contexts'
import {type S3AssetSource, S3AssetType, type S3ImageAsset} from '../../../types'
import {type S3ImageInputProps} from '../types'
import {S3ImageActionsMenu, S3ImageActionsMenuWaitPlaceholder} from './S3ImageActionsMenu'

type S3ImageInputAssetMenuWithReferenceAssetProps = Pick<
  S3ImageInputProps,
  'readOnly' | 'schemaType' | 'value'
> & {
  accept: string
  assetSources: S3AssetSource[]
  browseMenuItem: ReactNode
  handleRemoveButtonClick: () => void
  onSelectFile: (assetSource: S3AssetSource, file: File) => void
  isMenuOpen: boolean
  observeAsset: (assetId: string) => Observable<S3ImageAsset>
  reference: Reference
  setMenuButtonElement: (el: HTMLButtonElement | null) => void
  setMenuOpen: (isOpen: boolean) => void
}

const S3ImageInputAssetMenuWithReferenceAsset: FC<S3ImageInputAssetMenuWithReferenceAssetProps> = (
  props,
) => {
  const {
    accept,
    assetSources,
    browseMenuItem,
    handleRemoveButtonClick,
    onSelectFile,
    isMenuOpen,
    observeAsset,
    readOnly,
    reference,
    setMenuButtonElement,
    setMenuOpen,
  } = props

  const {directUploads} = useS3MediaOptionsContext()
  const {buildAssetUrl} = useS3MediaContext()

  const {t} = useTranslation()

  const documentId = reference?._ref
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset])
  const asset = useObservable(observable)
  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: S3AssetSource, files: File[]) => {
      onSelectFile(assetSource, files[0])
    },
    [onSelectFile],
  )

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files)
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource],
  )

  if (!documentId || !asset) {
    return <S3ImageActionsMenuWaitPlaceholder />
  }

  const {_id} = asset

  const url = buildAssetUrl({assetId: _id, assetType: S3AssetType.IMAGE})

  let uploadMenuItem: ReactNode = null
  switch (assetSourcesWithUpload.length) {
    case 0:
      uploadMenuItem = null
      break
    case 1:
      uploadMenuItem = (
        <FileInputMenuItem
          icon={UploadIcon}
          onSelect={handleSelectFilesFromAssetSourceSingle}
          accept={accept}
          data-asset-source-name={assetSourcesWithUpload[0].name}
          text={t('inputs.files.common.actions-menu.upload.label')}
          disabled={readOnly || directUploads === false}
        />
      )
      break
    default:
      uploadMenuItem = (
        <UploadDropDownMenu
          accept={accept}
          assetSources={assetSourcesWithUpload}
          directUploads={directUploads}
          onSelectFiles={handleSelectFilesFromAssetSource}
          readOnly={readOnly}
          renderAsMenuGroup
        />
      )
  }

  return (
    <S3ImageActionsMenu
      isMenuOpen={isMenuOpen}
      onMenuOpen={setMenuOpen}
      setMenuButtonElement={setMenuButtonElement}
    >
      <ActionsMenu
        upload={uploadMenuItem}
        browse={browseMenuItem}
        onReset={handleRemoveButtonClick}
        url={url}
        readOnly={readOnly}
      />
    </S3ImageActionsMenu>
  )
}

type S3ImageInputAssetMenuProps = Pick<S3ImageInputProps, 'readOnly' | 'schemaType' | 'value'> & {
  assetSources: S3AssetSource[]
  observeAsset: (assetId: string) => Observable<S3ImageAsset>
  handleRemoveButtonClick: () => void
  onSelectFile: (assetSource: S3AssetSource, file: File) => void
  handleSelectImageFromAssetSource: (source: S3AssetSource) => void
  isMenuOpen: boolean
  setMenuButtonElement: (el: HTMLButtonElement | null) => void
  setMenuOpen: (isOpen: boolean) => void
}

export const S3ImageInputAssetMenu: FC<S3ImageInputAssetMenuProps> = (props) => {
  const {
    assetSources,
    handleRemoveButtonClick,
    onSelectFile,
    handleSelectImageFromAssetSource,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    setMenuButtonElement,
    setMenuOpen,
    value,
  } = props
  const {t} = useTranslation()

  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])

  const asset = value?.asset

  if (!asset) {
    return null
  }

  let browseMenuItem: ReactNode =
    assetSources && assetSources.length === 0 ? null : (
      <MenuItem
        icon={SearchIcon}
        text={t('inputs.image.browse-menu.text')}
        onClick={() => {
          setMenuOpen(false)
          handleSelectImageFromAssetSource(assetSources[0])
        }}
        disabled={readOnly}
      />
    )
  if (assetSources && assetSources.length > 1) {
    browseMenuItem = assetSources.map((assetSource) => {
      return (
        <MenuItem
          key={assetSource.name}
          text={assetSource.title || startCase(assetSource.name)}
          onClick={() => {
            setMenuOpen(false)
            handleSelectImageFromAssetSource(assetSource)
          }}
          icon={assetSource.icon || ImageIcon}
          disabled={readOnly}
        />
      )
    })
  }

  return (
    <S3ImageInputAssetMenuWithReferenceAsset
      accept={accept}
      assetSources={assetSources}
      browseMenuItem={browseMenuItem}
      handleRemoveButtonClick={handleRemoveButtonClick}
      onSelectFile={onSelectFile}
      isMenuOpen={isMenuOpen}
      observeAsset={observeAsset}
      readOnly={readOnly}
      reference={asset}
      schemaType={schemaType}
      setMenuButtonElement={setMenuButtonElement}
      setMenuOpen={setMenuOpen}
      value={value}
    />
  )
}
