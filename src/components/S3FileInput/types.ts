import type { FileOptions, ObjectInputProps, ObjectSchemaType, UploadState } from 'sanity';
import type { SanityS3File } from 'sanity.types';
import type { FileInfo } from '../../types';

export type S3FileSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options?: FileOptions;
};

type S3FileInputValue = Partial<SanityS3File> & {
  _upload?: UploadState;
};

export type S3FileInputProps = ObjectInputProps<S3FileInputValue, S3FileSchemaType> & {
  assetSources: AssetSource[];
  directUploads?: boolean;
  observeAsset: (documentId: string) => Observable<FileAsset>;
  resolveUploader: UploaderResolver;
};

export type S3FileAssetProps = Omit<S3FileInputProps, 'renderDefault'> & {
  browseButtonElementRef: React.RefObject<HTMLButtonElement | null>;
  clearField: () => void;
  hoveringFiles: FileInfo[];
  isBrowseMenuOpen: boolean;
  isStale: boolean;
  isUploading: boolean;
  onCancelUpload?: () => void;
  onClearUploadStatus: () => void;
  onSelectAssets: (assetsFromSource: AssetFromSource[]) => void;
  onSelectFiles: (files: File[]) => void;
  onStale: () => void;
  selectedAssetSource: AssetSource | null;
  setBrowseButtonElement: (element: HTMLButtonElement | null) => void;
  setHoveringFiles: (hoveringFiles: FileInfo[]) => void;
  setIsBrowseMenuOpen: (isBrowseMenuOpen: boolean) => void;
  setIsUploading: (isUploading: boolean) => void;
  setSelectedAssetSource: (assetSource: AssetSource | null) => void;
  uploader?: AssetSourceUploader;
};
