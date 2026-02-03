import type {ObjectInputProps, UploadState} from 'sanity'

import type {S3File, S3FileSchemaType} from '../../types'

type S3FileInputValue = Partial<S3File> & {_upload?: UploadState}

export type S3FileInputProps = ObjectInputProps<S3FileInputValue, S3FileSchemaType>
