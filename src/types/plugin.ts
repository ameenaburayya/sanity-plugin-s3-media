/** @public */
export type S3MediaPluginOptions = {
  directUploads?: boolean
  maxSize?: number
}

/** @public */
export type S3Credentials = {
  bucketKey: string
  bucketRegion: string
  getSignedUrlEndpoint: string
  deleteEndpoint?: string
  cloudfrontDomain?: string

  /**
   * Secret for validating the signed URL request (optional)
   *
   * 🚨 Give preference to storing this value in Sanity by leaving this configuration empty.
   * When you populate it here, it'll show up in the JS bundle of the Sanity studio.
   */
  secret?: string
}
