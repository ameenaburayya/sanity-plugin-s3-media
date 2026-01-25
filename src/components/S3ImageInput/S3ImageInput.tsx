import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { isImageSource } from '@sanity/asset-utils';
import { type AssetSourceUploader, type UploadState } from '@sanity/types';
import { Button, Stack, useToast } from '@sanity/ui';
import { type Subscription } from 'rxjs';
import { SearchIcon } from '@sanity/icons';
import { MemberField, useTranslation, type InputProps, PatchEvent, set, unset } from 'sanity';
import { UPLOAD_STATUS_KEY } from '../../constants';
import { UploadProgress } from '../common';
import {
  S3ImageInputAsset,
  S3ImageInputPreview,
  S3ImageInputAssetMenu,
  S3ImageInputAssetSource,
  S3ImageInputUploadPlaceholder
} from './components';

import { createInitialUploadPatches } from '../../utils/utils';
import type { S3ImageInputProps } from './types';

// import { ImageInputAssetSource } from './ImageInputAssetSource';
// import { InvalidImageWarning } from './InvalidImageWarning';

export const S3ImageInput: FC<S3ImageInputProps> = (props) => {
  const {
    assetSources,
    directUploads,
    elementProps,
    imageUrlBuilder,
    members,
    observeAsset,
    onChange,
    onPathFocus,
    path,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderItem,
    renderPreview: renderPreviewProp,
    schemaType,
    value
  } = props;

  const { push } = useToast();
  const { t } = useTranslation();

  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Get the menu button element in `ImageActionsMenu` so that focus can be restored to
  // it when closing the dialog (see `handleAssetSourceClosed`)
  const [menuButtonElement, setMenuButtonElement] = useState<HTMLButtonElement | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const uploadSubscription = useRef<null | Subscription>(null);

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void;
    uploader: AssetSourceUploader;
  } | null>(null);

  const valueIsArrayElement = useCallback(() => {
    const parentPathSegment = path.slice(-1)[0];

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    return typeof parentPathSegment !== 'string';
  }, [path]);

  const clearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(unset(['_upload']));
    }
  }, [onChange, value?._upload]);

  const cancelUpload = useCallback(() => {
    if (uploadSubscription.current) {
      uploadSubscription.current.unsubscribe();
      clearUploadStatus();
    }
  }, [clearUploadStatus]);

  const handleClearField = useCallback(() => {
    onChange([unset(['asset'])]);
  }, [onChange]);

  const handleRemoveButtonClick = useCallback(() => {
    // When removing the image, we should also remove any crop and hotspot
    // _type and _key are "meta"-properties and are not significant unless
    // other properties are present. Thus, we want to remove the entire
    // "container" object if these are the only properties present, BUT
    // only if we're not an array element, as removing the array element
    // will close the selection dialog. Instead, when closing the dialog,
    // the array logic will check for an "empty" value and remove it for us
    const allKeys = Object.keys(value || {});
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', '_upload', 'asset', 'crop', 'hotspot', 'media'].includes(key)
    );

    const isEmpty = remainingKeys.length === 0;
    const removeKeys = ['asset', 'media']
      .concat(allKeys.filter((key) => ['crop', 'hotspot', '_upload'].includes(key)))
      .map((key) => unset([key]));

    onChange(isEmpty && !valueIsArrayElement() ? unset() : removeKeys);
  }, [onChange, value, valueIsArrayElement]);

  const handleOpenDialog = useCallback(() => {
    onPathFocus(['hotspot']);
  }, [onPathFocus]);

  const handleCancelUpload = useCallback(() => {
    cancelUpload();
  }, [cancelUpload]);

  const handleClearUploadState = useCallback(() => {
    setIsStale(false);
    clearUploadStatus();
  }, [clearUploadStatus]);

  const handleStaleUpload = useCallback(() => {
    setIsStale(true);
  }, []);

  const handleSelectFileToUpload = useCallback(
    (file: File) => {
      if (assetSource.Uploader) {
        // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
        const run = () => {
          const uploader = new assetSource.Uploader!();
          // Unsubscribe from the previous uploader

          assetSourceUploader?.unsubscribe();
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
                  event.files.forEach((eventFile) => {
                    console.error(eventFile.error);
                  });
                  push({
                    status: 'error',
                    description: t('asset-sources.common.uploader.upload-failed.description'),
                    title: t('asset-sources.common.uploader.upload-failed.title')
                  });
                  break;
                case 'all-complete': {
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]));
                  setMenuOpen(false);
                  break;
                }
                default:
              }
            }),
            uploader
          });
          setIsUploading(true);
          onChange(PatchEvent.from(createInitialUploadPatches(file)));
          uploader.upload([file], { schemaType, onChange: onChange as (patch: unknown) => void });
        };

        try {
          run();
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]));
          setIsUploading(false);
          assetSourceUploader?.unsubscribe();
          setAssetSourceUploader(null);
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

  const handleAssetSourceClosed = useCallback(() => {
    setIsBrowserOpen(false);

    // Set focus on menu button in `ImageActionsMenu` when closing the dialog
    menuButtonElement?.focus();
  }, [menuButtonElement]);

  const renderPreview = useCallback<() => React.JSX.Element>(() => {
    if (!value) {
      return <></>;
    }

    return (
      <S3ImageInputPreview
        handleOpenDialog={handleOpenDialog}
        imageUrlBuilder={imageUrlBuilder}
        readOnly={readOnly}
        value={value}
      />
    );
  }, [handleOpenDialog, imageUrlBuilder, readOnly, value]);

  const renderAssetMenu = useCallback(() => {
    return (
      <S3ImageInputAssetMenu
        assetSources={assetSources}
        directUploads={directUploads}
        handleOpenDialog={handleOpenDialog}
        handleRemoveButtonClick={handleRemoveButtonClick}
        onSelectFile={handleSelectFileToUpload}
        imageUrlBuilder={imageUrlBuilder}
        isMenuOpen={isMenuOpen}
        observeAsset={observeAsset}
        readOnly={readOnly}
        schemaType={schemaType}
        setMenuButtonElement={setMenuButtonElement}
        setMenuOpen={setMenuOpen}
        value={value}
      />
    );
  }, [
    assetSources,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    handleSelectFileToUpload,
    imageUrlBuilder,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    value
  ]);

  const renderBrowser = useCallback(() => {
    return (
      <Button
        text={t('inputs.image.browse-menu.text')}
        icon={SearchIcon}
        mode='bleed'
        onClick={() => setIsBrowserOpen(true)}
        disabled={readOnly}
      />
    );
  }, [setIsBrowserOpen, readOnly]);

  const renderUploadPlaceholder = useCallback(() => {
    return (
      <S3ImageInputUploadPlaceholder
        directUploads={directUploads}
        onSelectFile={handleSelectFileToUpload}
        readOnly={readOnly}
        renderBrowser={renderBrowser}
        schemaType={schemaType}
      />
    );
  }, [directUploads, handleSelectFileToUpload, readOnly, renderBrowser, schemaType]);

  const renderUploadState = useCallback(
    (uploadState: UploadState) => {
      return (
        <UploadProgress
          uploadState={uploadState}
          onCancel={isUploading ? handleCancelUpload : undefined}
          onStale={handleStaleUpload}
        />
      );
    },
    [handleCancelUpload, handleStaleUpload, isUploading]
  );

  const renderAsset = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => {
      if (value && typeof value.asset !== 'undefined' && !value?._upload && !isImageSource(value)) {
        return <InvalidImageWarning onClearValue={handleClearField} />;
      }

      return (
        <S3ImageInputAsset
          assetSources={assetSources}
          directUploads={directUploads !== false}
          elementProps={elementProps}
          handleClearUploadState={handleClearUploadState}
          inputProps={inputProps}
          isStale={isStale}
          onSelectFile={handleSelectFileToUpload}
          readOnly={readOnly}
          renderAssetMenu={renderAssetMenu}
          renderPreview={renderPreview}
          renderUploadPlaceholder={renderUploadPlaceholder}
          renderUploadState={renderUploadState}
          schemaType={schemaType}
          value={value}
        />
      );
    },
    [
      assetSources,
      directUploads,
      elementProps,
      handleClearField,
      handleClearUploadState,
      handleSelectFileToUpload,
      isStale,
      readOnly,
      renderAssetMenu,
      renderPreview,
      renderUploadPlaceholder,
      renderUploadState,
      schemaType,
      value
    ]
  );

  const renderAssetSource = useCallback(() => {
    return (
      <S3ImageInputAssetSource
        handleBrowserClosed={handleAssetSourceClosed}
        isUploading={isUploading}
        observeAsset={observeAsset}
        schemaType={schemaType}
        uploader={assetSourceUploader?.uploader}
        value={value}
      />
    );
  }, [assetSourceUploader?.uploader, handleAssetSourceClosed, isUploading, observeAsset, schemaType, value]);

  return (
    // The Stack space should match the space in ObjectInput
    <Stack space={5}>
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
              renderPreview={renderPreviewProp}
            />
          );
        }

        return null;
      })}

      {isBrowserOpen && renderAssetSource()}
    </Stack>
  );
};
