import React, { useCallback, useMemo } from 'react';
import { isImageSource } from '@sanity/asset-utils';
import { MenuItem } from '@sanity/ui';
import { SearchIcon, UploadIcon } from '@sanity/icons';
import { type AssetSource } from '@sanity/types';
import { get } from 'lodash';
import { useObservable } from 'react-rx';
import { useTranslation } from 'sanity';
import { ActionsMenu, FileInputMenuItem } from '../../common';

import { S3ImageActionsMenu } from './S3ImageActionsMenu';
import { type BaseImageInputProps } from './types';

export const S3ImageInputAssetMenu = (
  props: Pick<
    BaseImageInputProps,
    'directUploads' | 'imageUrlBuilder' | 'observeAsset' | 'readOnly' | 'schemaType' | 'value'
  > & {
    handleOpenDialog: () => void;
    handleRemoveButtonClick: () => void;
    onSelectFile: (file: File) => void;
    isImageToolEnabled: boolean;
    isMenuOpen: boolean;
    setHotspotButtonElement: (el: HTMLButtonElement | null) => void;
    setMenuButtonElement: (el: HTMLButtonElement | null) => void;
    setMenuOpen: (isOpen: boolean) => void;
  }
) => {
  const {
    assetSources,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    onSelectFile,
    imageUrlBuilder,
    isImageToolEnabled,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    setHotspotButtonElement,
    setMenuButtonElement,
    setMenuOpen,
    value
  } = props;
  const { t } = useTranslation();

  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType]);
  const reference = value?.asset;

  const showAdvancedEditButton = value && reference && isImageToolEnabled;

  const documentId = reference?._ref;
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset]);
  const asset = useObservable(observable);
  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader));

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      onSelectFile(assetSource, files[0]);
    },
    [onSelectFile]
  );

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files);
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource]
  );

  const { _id, originalFilename, extension } = asset;
  let copyUrl: string | undefined;
  let downloadUrl: string | undefined;

  if (isImageSource(value)) {
    const filename = originalFilename || `download.${extension}`;

    downloadUrl = imageUrlBuilder.image(_id).forceDownload(filename).url();
    copyUrl = imageUrlBuilder.image(_id).url();
  }

  if (!reference || !documentId) {
    return null;
  }

  return (
    <S3ImageActionsMenu
      isMenuOpen={isMenuOpen}
      onEdit={handleOpenDialog}
      onMenuOpen={setMenuOpen}
      setHotspotButtonElement={setHotspotButtonElement}
      setMenuButtonElement={setMenuButtonElement}
      showEdit={!!showAdvancedEditButton}
    >
      <ActionsMenu
        upload={
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={handleSelectFilesFromAssetSourceSingle}
            accept={accept}
            data-asset-source-name={assetSourcesWithUpload[0].name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            disabled={readOnly || directUploads === false}
          />
        }
        browse={
          <MenuItem
            icon={SearchIcon}
            text={t('inputs.image.browse-menu.text')}
            onClick={() => {
              setMenuOpen(false);
            }}
            disabled={readOnly}
          />
        }
        onReset={handleRemoveButtonClick}
        downloadUrl={downloadUrl}
        copyUrl={copyUrl}
        readOnly={readOnly}
      />
    </S3ImageActionsMenu>
  );
};
