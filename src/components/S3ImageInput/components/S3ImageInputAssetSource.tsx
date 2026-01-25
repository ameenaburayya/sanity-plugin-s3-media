import React, { useCallback, useMemo, type FC } from 'react';
import { type AssetFromSource, type AssetSource, type AssetSourceUploader } from '@sanity/types';
import { get } from 'lodash';

import type { S3ImageInputProps } from '../types';
import { WithReferencedAsset } from '@superside/sanity/utils';

type S3ImageInputAssetSourceProps = Pick<
  S3ImageInputProps,
  'value' | 'schemaType' | 'observeAsset' | 'isUploading'
> & {
  selectedAssetSource: AssetSource | null;
  handleBrowserClosed: () => void;
  handleSelectAssetFromBrowser: (assetFromSource: AssetFromSource[]) => void;
  uploader?: AssetSourceUploader;
};

export const S3ImageInputAssetSource: FC<S3ImageInputAssetSourceProps> = (props) => {
  const {
    handleBrowserClosed,
    handleSelectAssetFromBrowser,
    observeAsset,
    schemaType,
    selectedAssetSource,
    uploader,
    value
  } = props;
  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType]);

  const handleClose = useCallback(() => {
    handleBrowserClosed();
  }, [handleBrowserClosed]);

  if (!selectedAssetSource) {
    return null;
  }
  const { component: Component } = selectedAssetSource;

  if (value && value.asset) {
    return (
      <WithReferencedAsset observeAsset={observeAsset} reference={value.asset}>
        {(imageAsset) => (
          <Component
            accept={accept}
            action='select'
            assetSource={selectedAssetSource}
            assetType='image'
            onClose={handleClose}
            onSelect={handleSelectAssetFromBrowser}
            schemaType={schemaType}
            selectedAssets={[imageAsset]}
            selectionType='single'
            uploader={uploader}
          />
        )}
      </WithReferencedAsset>
    );
  }

  return (
    <Component
      accept={accept}
      action='select'
      assetSource={selectedAssetSource}
      assetType='image'
      onClose={handleClose}
      onSelect={handleSelectAssetFromBrowser}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType='single'
      uploader={uploader}
    />
  );
};
