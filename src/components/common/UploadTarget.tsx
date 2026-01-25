import React, {
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useRef,
  useState
} from 'react';
import { type AssetSource, type SchemaType } from '@sanity/types';
import { Box, type CardTone, Flex, Text, useToast, Layer } from '@sanity/ui';
import { styled } from 'styled-components';
import {
  useTranslation,
  _isType,
  useFormBuilder,
  type InputOnSelectFileFunctionProps,
  type UploadEvent
} from 'sanity';
import { DropMessage } from './DropMessage';
import { type FileInfo, fileTarget } from './fileTarget';
import { resolveUploadAssetSources } from '../../utils/resolveUploadAssetSources';

import { type FIXME } from '../../../../../FIXME';

const Overlay = styled(Layer)`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background-color: var(--card-bg-color);
  opacity: 0.8;
`;

type FileEntry = {
  file: File;
  schemaType: SchemaType | null;
  assetSource: AssetSource | null;
};

export interface UploadTargetProps {
  types: SchemaType[];
  isReadOnly?: boolean;
  onUpload?: (event: UploadEvent) => void;
  onSetHoveringFiles?: (files: FileInfo[]) => void;
  onSelectFile?: (props: Omit<InputOnSelectFileFunctionProps, 'assetSource'>) => void;
  pasteTarget?: HTMLElement;
  tone?: CardTone;
  children?: ReactNode;
}

const Root = styled.div`
  position: relative;
`;

export function uploadTarget<Props>(
  Component: ComponentType<Props>
): ForwardRefExoticComponent<PropsWithoutRef<UploadTargetProps & Props> & RefAttributes<HTMLElement>> {
  const FileTarget = fileTarget<FIXME>(Component);

  // @ts-expect-error TODO fix PropsWithoutRef related union typings
  return forwardRef(function UploadTarget(
    props: UploadTargetProps & Props,
    forwardedRef: ForwardedRef<HTMLElement>
  ) {
    const {
      children,
      isReadOnly,
      onSelectFile,
      onSetHoveringFiles,
      types,
      tone: toneFromProps,
      pasteTarget,
      ...rest
    } = props;

    const { push: pushToast } = useToast();
    const { t } = useTranslation();

    const formBuilder = useFormBuilder();

    const [tone, setTone] = useState<CardTone>(toneFromProps || (isReadOnly ? 'transparent' : 'default'));

    const assetSourceDestinationName = useRef<string | null>(null);

    const alertRejectedFiles = useCallback(
      (rejected: FileEntry[]) => {
        pushToast({
          closable: true,
          status: 'warning',
          title: t('inputs.array.error.cannot-upload-unable-to-convert', {
            count: rejected.length
          }),
          description: rejected.map((task, i) => (
            // oxlint-disable-next-line no-array-index-key
            <Flex key={i} gap={2} padding={2}>
              <Box>
                <Text weight='medium'>{task.file.name}</Text>
              </Box>
              <Box>
                <Text size={1}>({task.file.type})</Text>
              </Box>
            </Flex>
          ))
        });
      },
      [pushToast, t]
    );

    // This is called after the user has dropped or pasted files and selected an asset source destination (if applicable)
    const handleUploadFiles = useCallback(
      (files: File[]) => {
        const filesAndAssetSources = getFilesAndAssetSources(
          files,
          types,
          assetSourceDestinationName.current,
          formBuilder
        );

        const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null);
        const rejected = filesAndAssetSources.filter((entry) => entry.assetSource === null);

        if (rejected.length > 0) {
          alertRejectedFiles(rejected);
        }
        if (onSelectFile) {
          ready.forEach((entry) => {
            onSelectFile({
              schemaType: entry.schemaType!,
              file: entry.file
            });
          });
        }
      },
      [alertRejectedFiles, formBuilder, onSelectFile, types]
    );

    // This is called when files are dropped or pasted onto the upload target. It may show the asset source destination picker if needed.
    const handleFiles = useCallback(
      (files: File[]) => {
        if (isReadOnly || types.length === 0) {
          return;
        }
        const filesAndAssetSources = getFilesAndAssetSources(
          files,
          types,
          assetSourceDestinationName.current,
          formBuilder
        );
        const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null);

        if (ready.length === 0) {
          alertRejectedFiles(filesAndAssetSources);

          return;
        }

        handleUploadFiles(ready.map((entry) => entry.file));
      },
      [alertRejectedFiles, isReadOnly, types, formBuilder, handleUploadFiles]
    );

    const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([]);

    const handleFilesOver = useCallback(
      (files: FileInfo[]) => {
        if (isReadOnly) {
          return;
        }
        setHoveringFiles(files);
        const acceptedFiles = files.filter((file) =>
          // eslint-disable-next-line max-nested-callbacks
          types.some((type) => resolveUploadAssetSources(type, formBuilder, file).length > 0)
        );
        const rejectedFilesCount = files.length - acceptedFiles.length;

        if (rejectedFilesCount > 0) {
          setTone('critical');
        } else if (acceptedFiles.length > 0) {
          setTone('primary');
        } else {
          setTone('default');
        }

        if (onSetHoveringFiles) {
          onSetHoveringFiles(files);
        }
      },
      [formBuilder, isReadOnly, onSetHoveringFiles, types]
    );

    const handleFilesOut = useCallback(() => {
      if (isReadOnly) {
        return;
      }
      setHoveringFiles([]);
      setTone('default');
      if (onSetHoveringFiles) {
        onSetHoveringFiles([]);
      }
    }, [isReadOnly, onSetHoveringFiles]);

    return (
      <Root>
        <FileTarget
          {...rest}
          tone={toneFromProps || tone}
          ref={forwardedRef}
          onFiles={handleFiles}
          onFilesOver={handleFilesOver}
          onFilesOut={handleFilesOut}
          pasteTarget={pasteTarget}
        >
          {hoveringFiles.length > 0 && (
            <Overlay zOffset={10}>
              <DropMessage hoveringFiles={hoveringFiles} types={types} />
            </Overlay>
          )}
          {children}
        </FileTarget>
      </Root>
    );
  });
}

function getFilesAndAssetSources(
  files: File[],
  types: SchemaType[],
  assetSourceDestinationName: string | null,
  formBuilder: FIXME
): FileEntry[] {
  // Find the first image and file type in the provided types
  // Note: these types could be hoisted, so use isType to check
  const imageType = types.find((type) => _isType(type, 'image'));
  const fileType = types.find((type) => _isType(type, 'file'));

  return files.map((file) => {
    const imageAssetSource =
      (imageType &&
        resolveUploadAssetSources(imageType, formBuilder, file).find(
          (source) => !assetSourceDestinationName || source.name === assetSourceDestinationName
        )) ||
      null;

    const isImage = imageType && file.type.startsWith('image/') && imageAssetSource;

    if (isImage) {
      return {
        file,
        schemaType: imageType,
        assetSource: imageAssetSource
      };
    }
    const fileAssetSource =
      (fileType &&
        resolveUploadAssetSources(fileType, formBuilder, file).find(
          (source) => !assetSourceDestinationName || source.name === assetSourceDestinationName
        )) ||
      null;
    const isFile = fileType && fileAssetSource;

    if (isFile) {
      return {
        file,
        schemaType: fileType,
        assetSource: fileAssetSource
      };
    }

    return {
      file,
      schemaType: null,
      assetSource: null
    };
  });
}
