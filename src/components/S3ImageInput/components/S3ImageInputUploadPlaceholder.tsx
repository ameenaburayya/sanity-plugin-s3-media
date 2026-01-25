import React, { useCallback } from 'react';
import { Card } from '@sanity/ui';

import { UploadPlaceholder } from '../../common/UploadPlaceholder';
import { type BaseImageInputProps } from './types';

export const S3ImageInputUploadPlaceholder = (props: {
  directUploads: boolean | undefined;
  onSelectFile: (file: File) => void;
  readOnly: boolean | undefined;
  renderBrowser(): React.JSX.Element | null;
  schemaType: BaseImageInputProps['schemaType'];
}) => {
  const { directUploads, onSelectFile, readOnly, renderBrowser, schemaType } = props;

  const handleOnUpload = useCallback(
    (files: File[]) => {
      onSelectFile(files[0]);
    },
    [onSelectFile]
  );

  return (
    <div style={{ padding: 1 }}>
      <Card tone={readOnly ? 'transparent' : 'inherit'} border paddingX={3} paddingY={2} radius={2}>
        <UploadPlaceholder
          browse={renderBrowser()}
          directUploads={directUploads}
          onUpload={handleOnUpload}
          schemaType={schemaType}
          readOnly={readOnly}
          type='image'
        />
      </Card>
    </div>
  );
};
