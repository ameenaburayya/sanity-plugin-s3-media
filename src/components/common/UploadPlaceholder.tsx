import React, { type FC, type ReactNode, useState } from 'react';
import { UploadIcon } from '@sanity/icons';
import { type SchemaType } from '@sanity/types';
import { Flex, useElementSize } from '@sanity/ui';
import { get } from 'lodash';
import { useTranslation, type FileLike } from 'sanity';

import { FileInputButton } from './FileInputButton';
import { PlaceholderText } from './PlaceholderText';

type UploadPlaceholderProps = {
  browse?: ReactNode;
  directUploads?: boolean;
  hoveringFiles?: FileLike[];
  onUpload?: (files: File[]) => void;
  readOnly?: boolean;
  schemaType: SchemaType;
  type: string;
};

export const UploadPlaceholder: FC<UploadPlaceholderProps> = (props) => {
  const { browse, directUploads, hoveringFiles, onUpload, readOnly, schemaType, type } = props;

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const rect = useElementSize(rootElement);

  const collapsed = rect?.border && rect.border.width < 440;
  const { t } = useTranslation();

  const accept = get(schemaType, 'options.accept', '');

  return (
    <Flex
      align={collapsed ? undefined : 'center'}
      direction={collapsed ? 'column' : 'row'}
      gap={4}
      justify='space-between'
      paddingY={collapsed ? 1 : undefined}
      ref={setRootElement}
    >
      <Flex flex={1}>
        <PlaceholderText
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          readOnly={readOnly}
          type={type}
        />
      </Flex>

      <Flex align='center' gap={1} justify='center' wrap='wrap'>
        <FileInputButton
          accept={accept}
          disabled={readOnly || directUploads === false}
          icon={UploadIcon}
          mode='bleed'
          onSelect={onUpload}
          text={t('input.files.common.upload-placeholder.file-input-button.text')}
        />

        {browse}
      </Flex>
    </Flex>
  );
};
