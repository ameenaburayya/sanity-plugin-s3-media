import defineCreateClientExports from './defineCreateClient'
import {S3Client} from './S3Client'
import type {S3ClientConfig} from './types'

export {S3Client} from './S3Client'

const exp = defineCreateClientExports<S3Client, S3ClientConfig>(S3Client)

/** @public */
export const createS3Client = exp.createClient
