import React, { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { type AssetSource, type AssetSourceUploader, type FileAsset } from '@sanity/types';
import { useToast } from '@sanity/ui';
import { useTranslation, MemberField, PatchEvent, set, unset } from 'sanity';
import { UPLOAD_STATUS_KEY } from '../../constants';
import { createInitialUploadPatches } from '../../utils/utils';
import type { FileInfo } from '../../types';

import { S3FileAsset as S3FileAssetComponent, S3FileInputAssetSource } from './components';
import type { S3FileInputProps } from './types';

export const S3FileInput: FC<S3FileInputProps> = (props) => {
  const {
    members,
    onChange,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderItem,
    renderPreview,
    schemaType,
    value
  } = props;

  const { push } = useToast();
  const { t } = useTranslation();

  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([]);
  const [isStale, setIsStale] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBrowseMenuOpen, setIsBrowseMenuOpen] = useState(false);
  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null);
  const browseButtonElementRef = useRef<HTMLButtonElement>(null);

  // State for "open in source" component mode
  const [openInSourceAsset, setOpenInSourceAsset] = useState<FileAsset | null>(null);

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void;
    uploader: AssetSourceUploader;
  } | null>(null);

  const setBrowseButtonElement = useCallback(
    (element: HTMLButtonElement | null) => {
      if (element) {
        browseButtonElementRef.current = element;
      }
    },
    [browseButtonElementRef]
  );

  const handleClearField = useCallback(() => {
    onChange([unset(['asset']), unset(['media'])]);
  }, [onChange]);

  const handleClearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(PatchEvent.from([unset(['_upload'])]));
    }
  }, [onChange, value?._upload]);

  const handleStaleUpload = useCallback(() => {
    setIsStale(true);
  }, []);

  const handleSelectFilesToUpload = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setSelectedAssetSource(assetSource);
      if (assetSource.Uploader) {
        const uploader = new assetSource.Uploader();

        // Unsubscribe from the previous uploader
        assetSourceUploader?.unsubscribe();
        try {
          setAssetSourceUploader({
            unsubscribe: uploader.subscribe((event) => {
              switch (event.type) {
                case 'progress':
                  onChange(
                    PatchEvent.from([
                      set(Math.max(2, event.progress), [UPLOAD_STATUS_KEY, 'progress']),
                      set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt'])
                    ])
                  );
                  break;
                case 'error':
                  event.files.forEach((file) => {
                    console.error(file.error);
                  });
                  push({
                    status: 'error',
                    description: t('asset-sources.common.uploader.upload-failed.description'),
                    title: t('asset-sources.common.uploader.upload-failed.title')
                  });
                  break;
                case 'all-complete': {
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]));
                  break;
                }
                default:
              }
            }),
            uploader
          });
          setIsUploading(true);
          onChange(PatchEvent.from(createInitialUploadPatches(files[0])));
          uploader.upload(files, { schemaType, onChange: onChange as (patch: unknown) => void });
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]));
          setIsUploading(false);
          setSelectedAssetSource(null);
          assetSourceUploader?.unsubscribe();
          push({
            status: 'error',
            description: t('asset-sources.common.uploader.upload-failed.description'),
            title: t('asset-sources.common.uploader.upload-failed.title')
          });
          console.error(err);
        }
      }
    },
    [assetSourceUploader, onChange, push, schemaType, t]
  );

  // Abort asset source uploads and unsubscribe from the uploader is the component unmounts
  useEffect(() => {
    return () => {
      assetSourceUploader?.uploader?.abort();
      assetSourceUploader?.unsubscribe();
    };
  }, [assetSourceUploader]);

  const handleCancelUpload = useCallback(() => {
    assetSourceUploader?.uploader?.abort();
  }, [assetSourceUploader]);

  const renderAsset = useCallback(() => {
    return (
      <S3FileAssetComponent
        {...props}
        browseButtonElementRef={browseButtonElementRef}
        clearField={handleClearField}
        hoveringFiles={hoveringFiles}
        isBrowseMenuOpen={isBrowseMenuOpen}
        isStale={isStale}
        isUploading={isUploading}
        onCancelUpload={handleCancelUpload}
        onClearUploadStatus={handleClearUploadStatus}
        onSelectFiles={handleSelectFilesToUpload}
        onStale={handleStaleUpload}
        selectedAssetSource={selectedAssetSource}
        setBrowseButtonElement={setBrowseButtonElement}
        setHoveringFiles={setHoveringFiles}
        setIsBrowseMenuOpen={setIsBrowseMenuOpen}
        setIsUploading={setIsUploading}
        setSelectedAssetSource={setSelectedAssetSource}
      />
    );
  }, [
    handleCancelUpload,
    handleClearField,
    handleClearUploadStatus,
    handleSelectFilesToUpload,
    handleStaleUpload,
    hoveringFiles,
    isBrowseMenuOpen,
    isStale,
    isUploading,
    props,
    selectedAssetSource,
    setBrowseButtonElement
  ]);

  return (
    <>
      {members.map((member) => {
        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderInput={renderAsset}
              renderField={({ children }) => children}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          );
        }

        return null;
      })}

      {selectedAssetSource && (
        <S3FileInputAssetSource
          {...props}
          browseButtonElementRef={browseButtonElementRef}
          clearField={handleClearField}
          hoveringFiles={hoveringFiles}
          isBrowseMenuOpen={isBrowseMenuOpen}
          isStale={isStale}
          isUploading={isUploading}
          onClearUploadStatus={handleClearUploadStatus}
          onStale={handleStaleUpload}
          onSelectFiles={handleSelectFilesToUpload}
          openInSourceAsset={openInSourceAsset}
          selectedAssetSource={selectedAssetSource}
          setBrowseButtonElement={setBrowseButtonElement}
          setOpenInSourceAsset={setOpenInSourceAsset}
          setHoveringFiles={setHoveringFiles}
          setIsBrowseMenuOpen={setIsBrowseMenuOpen}
          setIsUploading={setIsUploading}
          setSelectedAssetSource={setSelectedAssetSource}
          uploader={assetSourceUploader?.uploader}
        />
      )}
    </>
  );
};
