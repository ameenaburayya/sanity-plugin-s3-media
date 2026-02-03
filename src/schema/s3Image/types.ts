import type {ObjectInputProps, UploadState} from 'sanity'

import type {S3Image, S3ImageSchemaType} from '../../types'

type S3ImageInputValue = Partial<S3Image> & {_upload?: UploadState}

export type S3ImageInputProps = ObjectInputProps<S3ImageInputValue, S3ImageSchemaType>
