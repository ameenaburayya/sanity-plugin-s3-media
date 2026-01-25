import React, { type FC, type ReactNode, useCallback, useMemo, useState } from 'react';
import { isFileSource } from '@sanity/asset-utils'; // TODO: change this
import { SearchIcon, UploadIcon } from '@sanity/icons';
import { type AssetSource, type FileAsset } from '@sanity/types';
import { get } from 'lodash';
import { MenuItem } from '@sanity/ui';
import { useTranslation } from 'sanity';

import { WithReferencedAsset } from '@superside/sanity/utils';
import { ActionsMenu, FileInputMenuItem } from '../../common';
import { type S3FileAssetProps } from '../types';
import { S3FileActionsMenu } from './S3FileActionsMenu';
import { S3FileSkeleton } from './S3FileSkeleton';

export const S3FilePreview: FC<S3FileAssetProps> = (props) => {
  const {
    assetSources,
    clearField,
    directUploads,
    observeAsset,
    onSelectFiles,
    readOnly,
    schemaType,
    setBrowseButtonElement,
    setSelectedAssetSource,
    value
  } = props;

  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const asset = value?.asset;

  const accept = get(schemaType, 'options.accept', '');

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader));

  const handleSelectFileMenuItemClicked = useCallback(
    (event: React.MouseEvent) => {
      setIsMenuOpen(false);
      const assetSourceNameData = event.currentTarget.getAttribute('data-asset-source-name');
      const assetSource = assetSources.find((source) => source.name === assetSourceNameData);

      if (assetSource) {
        setSelectedAssetSource(assetSource);
      } else {
        console.warn(`No asset source found for the selected asset source name '${assetSourceNameData}'`);
      }
    },
    [assetSources, setSelectedAssetSource]
  );

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      setIsMenuOpen(false);
      onSelectFiles(assetSource, files);
    },
    [onSelectFiles]
  );

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files);
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource]
  );

  if (!asset) {
    return null;
  }

  return (
    <WithReferencedAsset reference={asset} observeAsset={observeAsset} waitPlaceholder={<S3FileSkeleton />}>
      {(fileAsset: FileAsset) => (
        <FilePreviewContent
          uploadMenuItem={
            <FileInputMenuItem
              icon={UploadIcon}
              onSelect={handleSelectFilesFromAssetSourceSingle}
              accept={accept}
              data-asset-source-name={assetSourcesWithUpload[0].name}
              text={t('inputs.files.common.actions-menu.upload.label')}
              data-testid={`file-input-upload-button-${assetSourcesWithUpload[0].name}`}
              disabled={readOnly || directUploads === false}
            />
          }
          browseMenuItem={
            <MenuItem
              icon={SearchIcon}
              text={t('inputs.file.browse-button.text')}
              onClick={handleSelectFileMenuItemClicked}
              disabled={readOnly}
            />
          }
          clearField={clearField}
          fileAsset={fileAsset}
          isMenuOpen={isMenuOpen}
          readOnly={readOnly}
          setIsMenuOpen={setIsMenuOpen}
          setBrowseButtonElement={setBrowseButtonElement}
          value={value}
        />
      )}
    </WithReferencedAsset>
  );
};

function FilePreviewContent({
  browseMenuItem,
  clearField,
  fileAsset,
  isMenuOpen,
  readOnly,
  setIsMenuOpen,
  setBrowseButtonElement,
  uploadMenuItem,
  value
}: {
  browseMenuItem: ReactNode;
  clearField: () => void;
  fileAsset: FileAsset;
  isMenuOpen: boolean;
  readOnly?: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  setBrowseButtonElement: (element: HTMLButtonElement | null) => void;
  uploadMenuItem: ReactNode;
  value: S3FileAssetProps['value'];
}) {
  const { originalFilename, extension, url, size } = fileAsset;
  const filename = originalFilename || `download.${extension}`;
  let copyUrl: string | undefined;
  let downloadUrl: string | undefined;

  if (isFileSource(value)) {
    downloadUrl = `${url}?dl`;
    copyUrl = url;
  }

  return (
    <S3FileActionsMenu
      size={size}
      originalFilename={filename}
      muted={!readOnly}
      onMenuOpen={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      setMenuButtonElement={setBrowseButtonElement}
    >
      <ActionsMenu
        browse={browseMenuItem}
        upload={uploadMenuItem}
        onReset={clearField}
        downloadUrl={downloadUrl}
        copyUrl={copyUrl}
        readOnly={readOnly}
      />
    </S3FileActionsMenu>
  );
}
