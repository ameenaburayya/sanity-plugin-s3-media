import React, { useCallback, useEffect, useState, type FC } from 'react';
import { type ImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { useDevicePixelRatio } from 'use-device-pixel-ratio';
import { useTranslation, LoadingBlock } from 'sanity';
import { Card, Flex, Text } from '@sanity/ui';
import { WarningOutlineIcon } from '@sanity/icons';
import { styled } from 'styled-components';
import { useImageUrl } from '../hooks';
import { type BaseImageInputValue } from './types';
import { RatioBox } from '../../common/RatioBox';

type S3ImageInputPreviewProps = {
  handleOpenDialog: () => void;
  imageUrlBuilder: ImageUrlBuilder;
  readOnly: boolean | undefined;
  value: BaseImageInputValue;
};

const Overlay = styled(Card)`
  display: flex;
  justify-content: flex-end;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(10px);
  background-color: color-mix(in srgb, transparent, var(--card-bg-color) 80%);
`;

const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const ErrorIconWrapper = styled.div`
  align-items: center;
  color: var(--card-icon-color);
  display: flex;
  font-size: 1.5em;
  justify-content: center;
`;

export const S3ImageInputPreview: FC<S3ImageInputPreviewProps> = (props) => {
  const { handleOpenDialog, imageUrlBuilder, readOnly, value } = props;

  const [isLoaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { t } = useTranslation();

  const dpr = useDevicePixelRatio();

  const showAccessWarning = hasError;
  const showLoading = !isLoaded && !showAccessWarning;

  const transform = (builder: ImageUrlBuilder, val: SanityImageSource) =>
    builder.width(2000).fit('max').image(val).dpr(dpr).auto('format').url();

  const { url } = useImageUrl({
    imageSource: value,
    imageUrlBuilder,
    transform
  });

  useEffect(() => {
    /* set for when the src is being switched when the image input already had a image src
    - meaning it already had an asset */
    setLoaded(false);
    setHasError(false);
  }, [url]);

  const onLoadChange = useCallback(() => {
    setLoaded(true);
    setHasError(false);
  }, []);

  const onErrorChange = useCallback(() => {
    setHasError(true);
    setLoaded(false);
  }, []);

  return (
    <RatioBox onDoubleClick={handleOpenDialog} readOnly={readOnly} tone='transparent'>
      {showAccessWarning && <AccessWarningOverlay />}
      {showLoading && <LoadingOverlay />}

      {url && (
        <img
          src={url}
          alt={t('inputs.image.preview-uploaded-image')}
          onLoad={onLoadChange}
          onError={onErrorChange}
          referrerPolicy='strict-origin-when-cross-origin'
        />
      )}
    </RatioBox>
  );
};

function LoadingOverlay() {
  return (
    <Overlay padding={3} tone='transparent'>
      <FlexOverlay direction='column' align='center' justify='center'>
        <LoadingBlock showText />
      </FlexOverlay>
    </Overlay>
  );
}

function AccessWarningOverlay() {
  const { t } = useTranslation();

  return (
    <Overlay padding={3} tone='critical' border>
      <FlexOverlay direction='column' align='center' justify='center' gap={2}>
        <ErrorIconWrapper>
          <WarningOutlineIcon />
        </ErrorIconWrapper>
        <Text muted size={1}>
          {t('inputs.image.error.possible-access-restriction')}
        </Text>
      </FlexOverlay>
    </Overlay>
  );
}
