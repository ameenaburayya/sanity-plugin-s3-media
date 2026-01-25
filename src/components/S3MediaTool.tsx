import React, { type FC } from 'react';
import { VendorConfiguration } from '../types';
import { S3ClientContextProvider } from '../contexts';

export const S3MediaTool: FC<VendorConfiguration> = (props) => {
  return <S3ClientContextProvider vendorConfig={props}>s3 media</S3ClientContextProvider>;
};
