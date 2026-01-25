import React, { useCallback, useMemo, type FC } from 'react';
import { isFileSource } from '@sanity/asset-utils'; // TODO: change this
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { ChangeIndicator, useTranslation } from 'sanity';
import { ResetIcon, SearchIcon, WarningOutlineIcon } from '@sanity/icons';
import { UploadProgress, UploadTargetCard, UploadWarning, UploadPlaceholder } from '../../common';
import { type S3FileAssetProps } from '../types';
import { S3FilePreview } from './S3FilePreview';

const ASSET_FIELD_PATH = ['asset'];

export const S3FileAsset: FC<S3FileAssetProps> = (props) => {
  const {
    changed,
    clearField,
    directUploads,
    elementProps,
    isStale,
    isUploading,
    onCancelUpload,
    onClearUploadStatus,
    onSelectFiles,
    onStale,
    path,
    readOnly,
    schemaType,
    value,
    focused
  } = props;

  const assetFieldPath = useMemo(() => path.concat(ASSET_FIELD_PATH), [path]);

  const handleFileTargetFocus = useCallback(
    (event: React.FocusEvent) => {
      // We want to handle focus when the file target element *itself* receives
      // focus, not when an interactive child element receives focus. Since React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (event.currentTarget === event.target && event.currentTarget === elementProps.ref?.current) {
        elementProps.onFocus(event);
      }
    },
    [elementProps]
  );

  const handleSelectFiles = useCallback(
    (files: globalThis.File[]) => {
      if (directUploads && !readOnly) {
        onSelectFiles(files);
      }
    },
    [directUploads, onSelectFiles, readOnly]
  );

  if (value && typeof value.asset !== 'undefined' && !value?._upload && !isFileSource(value)) {
    return <InvalidFileWarning onClearValue={clearField} />;
  }

  return (
    <>
      {isStale && (
        <Box marginBottom={2}>
          <UploadWarning onClearStale={onClearUploadStatus} />
        </Box>
      )}
      <ChangeIndicator path={assetFieldPath} hasFocus={!!focused} isChanged={changed}>
        {/* not uploading */}
        {value?._upload ? (
          <UploadProgress
            uploadState={value._upload}
            onCancel={isUploading && onCancelUpload ? onCancelUpload : undefined}
            onStale={onStale}
          />
        ) : (
          <UploadTargetCard
            {...elementProps}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onSelectFile={({ file }) => handleSelectFiles([file])}
            radius={2}
            sizing='border'
            style={{ padding: 1 }}
            tabIndex={0}
            types={[schemaType]}
          >
            <div style={{ position: 'relative' }}>
              {!value?.asset && <FileUploadPlaceHolder {...props} onSelectFiles={handleSelectFiles} />}
              {!value?._upload && value?.asset && <S3FilePreview {...props} />}
            </div>
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </>
  );
};

const FileUploadPlaceHolder: FC<S3FileAssetProps> = (props) => {
  const { directUploads, onSelectFiles, schemaType, readOnly, browseButtonElementRef, setIsBrowseMenuOpen } =
    props;

  const { t } = useTranslation();

  return (
    <>
      <Card tone={readOnly ? 'transparent' : 'inherit'} border paddingX={3} paddingY={2} radius={2}>
        <UploadPlaceholder
          browse={
            <Button
              text={t('inputs.file.browse-button.text')}
              icon={SearchIcon}
              mode='bleed'
              onClick={() => setIsBrowseMenuOpen(true)}
              disabled={readOnly}
              ref={browseButtonElementRef}
            />
          }
          directUploads={directUploads}
          onUpload={onSelectFiles}
          schemaType={schemaType}
          readOnly={readOnly}
          type='file'
        />
      </Card>
    </>
  );
};

const InvalidFileWarning = ({ onClearValue }: { onClearValue: () => void }) => {
  const { t } = useTranslation();

  return (
    <Card tone='caution' padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>

        <Stack space={3}>
          <Text size={1} weight='medium'>
            {t('inputs.file.invalid-file-warning.title')}
          </Text>
          <Text size={1}>{t('inputs.file.invalid-file-warning.description')}</Text>
        </Stack>
      </Flex>

      <Button
        icon={ResetIcon}
        mode='ghost'
        onClick={onClearValue}
        text={t('inputs.file.invalid-file-warning.reset-button.text')}
        width='fill'
      />
    </Card>
  );
};
