import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {get, startCase} from 'lodash'
import {type FC, type MouseEvent, type ReactNode, useCallback, useMemo, useState} from 'react'
import type {Observable} from 'rxjs'
import {useTranslation} from 'sanity'

import {
  ActionsMenu,
  FileInputMenuItem,
  MenuItem,
  UploadDropDownMenu,
  WithReferencedAsset,
} from '../../../components'
import {useS3MediaContext, useS3MediaOptionsContext} from '../../../contexts'
import {type S3AssetSource, S3AssetType, type S3FileAsset} from '../../../types'
import {type S3FileInputProps} from '../types'
import {S3FileActionsMenu} from './S3FileActionsMenu'
import {S3FileSkeleton} from './S3FileSkeleton'

type S3FileInputPreviewContentProps = Pick<S3FileInputProps, 'readOnly' | 'value'> & {
  browseMenuItem: ReactNode
  clearField: () => void
  fileAsset: S3FileAsset
  isMenuOpen: boolean
  setIsMenuOpen: (isOpen: boolean) => void
  uploadMenuItem: ReactNode
}

const S3FileInputPreviewContent: FC<S3FileInputPreviewContentProps> = (props) => {
  const {
    browseMenuItem,
    clearField,
    fileAsset,
    isMenuOpen,
    readOnly,
    setIsMenuOpen,
    uploadMenuItem,
  } = props

  const {buildAssetUrl} = useS3MediaContext()

  const url = buildAssetUrl({assetId: fileAsset._id, assetType: S3AssetType.FILE})

  return (
    <S3FileActionsMenu
      fileAsset={fileAsset}
      muted={!readOnly}
      disabled={readOnly}
      onMenuOpen={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
    >
      <ActionsMenu
        browse={browseMenuItem}
        upload={uploadMenuItem}
        onReset={clearField}
        url={url}
        readOnly={readOnly}
      />
    </S3FileActionsMenu>
  )
}

type S3FileInputPreviewProps = Pick<S3FileInputProps, 'readOnly' | 'schemaType' | 'value'> & {
  assetSources: S3AssetSource[]
  observeAsset: (id: string) => Observable<S3FileAsset>
  clearField: () => void
  onSelectFiles: (assetSource: S3AssetSource, files: File[]) => void
  setSelectedAssetSource: (assetSource: S3AssetSource | null) => void
}

export const S3FileInputPreview: FC<S3FileInputPreviewProps> = (props) => {
  const {
    assetSources,
    clearField,
    observeAsset,
    onSelectFiles,
    readOnly,
    schemaType,
    setSelectedAssetSource,
    value,
  } = props

  const {t} = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const asset = value?.asset

  const {directUploads} = useS3MediaOptionsContext()

  const accept = get(schemaType, 'options.accept', '')

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))

  const handleSelectFileMenuItemClicked = useCallback(
    (event: MouseEvent) => {
      setIsMenuOpen(false)
      const assetSourceNameData = event.currentTarget.getAttribute('data-asset-source-name')
      const assetSource = assetSources.find((source) => source.name === assetSourceNameData)
      if (assetSource) {
        setSelectedAssetSource(assetSource)
      } else {
        console.warn(
          `No asset source found for the selected asset source name '${assetSourceNameData}'`,
        )
      }
    },
    [assetSources, setSelectedAssetSource],
  )

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: S3AssetSource, files: File[]) => {
      setIsMenuOpen(false)
      onSelectFiles(assetSource, files)
    },
    [onSelectFiles],
  )

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files)
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource],
  )

  const browseMenuItem: ReactNode = useMemo(() => {
    if (assetSources.length === 0) {
      return null
    }

    if (assetSources.length === 1) {
      return (
        <MenuItem
          icon={SearchIcon}
          text={t('inputs.file.browse-button.text')}
          onClick={handleSelectFileMenuItemClicked}
          disabled={readOnly}
          data-asset-source-name={assetSources[0].name}
        />
      )
    }
    return assetSources.map((assetSource) => {
      return (
        <MenuItem
          key={assetSource.name}
          text={assetSource.title || startCase(assetSource.name)}
          onClick={handleSelectFileMenuItemClicked}
          icon={assetSource.icon || ImageIcon}
          disabled={readOnly}
          data-asset-source-name={assetSource.name}
        />
      )
    })
  }, [assetSources, handleSelectFileMenuItemClicked, readOnly, t])

  const uploadMenuItem: ReactNode = useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1:
        return (
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={handleSelectFilesFromAssetSourceSingle}
            accept={accept}
            data-asset-source-name={assetSourcesWithUpload[0].name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            disabled={readOnly || directUploads === false}
          />
        )
      default:
        return (
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
  }, [
    accept,
    assetSourcesWithUpload,
    directUploads,
    handleSelectFilesFromAssetSource,
    handleSelectFilesFromAssetSourceSingle,
    readOnly,
    t,
  ])

  if (!asset) {
    return null
  }

  return (
    <WithReferencedAsset
      reference={asset}
      observeAsset={observeAsset}
      waitPlaceholder={<S3FileSkeleton />}
    >
      {(fileAsset) => (
        <S3FileInputPreviewContent
          browseMenuItem={browseMenuItem}
          clearField={clearField}
          fileAsset={fileAsset}
          isMenuOpen={isMenuOpen}
          readOnly={readOnly}
          setIsMenuOpen={setIsMenuOpen}
          uploadMenuItem={uploadMenuItem}
          value={value}
        />
      )}
    </WithReferencedAsset>
  )
}
