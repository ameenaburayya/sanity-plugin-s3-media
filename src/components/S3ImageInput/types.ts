import type { FileOptions, ObjectInputProps, ObjectSchemaType, UploadState } from 'sanity';
import type { SanityS3Image } from 'sanity.types';

export type S3ImageSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options?: FileOptions;
};

type S3ImageInputValue = Partial<SanityS3Image> & {
  _upload?: UploadState;
};

export type S3ImageInputProps = ObjectInputProps<S3ImageInputValue, S3ImageSchemaType> & {
  directUploads?: boolean;
  isUploading: boolean;
  observeAsset: (documentId: string) => Observable<ImageAsset>;
};
