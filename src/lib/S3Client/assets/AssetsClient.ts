import {lastValueFrom, Observable} from 'rxjs'
import {filter} from 'rxjs/operators'

import type {S3AssetType} from '../../../types'
import type {ObservableS3Client, S3Client} from '../S3Client'
import type {HttpRequestEvent, ResponseEvent} from '../types'
import * as validators from '../validators'

const upload = ({
  file,
  fileName,
  client,
  assetType,
}: {
  file: File
  fileName: string
  client: S3Client | ObservableS3Client
  assetType: S3AssetType
}): Observable<HttpRequestEvent> => {
  validators.validateAssetType(assetType)

  const config = client.config()

  const {bucketRegion, bucketKey, getSignedUrlEndpoint, secret} = config

  // Validate required config fields
  if (!bucketRegion) {
    throw new Error('S3Client: Missing required config field: bucketRegion')
  }
  if (!bucketKey) {
    throw new Error('S3Client: Missing required config field: bucketKey')
  }
  if (!getSignedUrlEndpoint) {
    throw new Error('S3Client: Missing required config field: getSignedUrlEndpoint')
  }
  if (!secret) {
    throw new Error('S3Client: Missing required config field: secret')
  }

  if (!fileName) {
    throw new Error('S3Client: filename is required in options')
  }

  const fileSize = file.size || 0
  const fileType = file.type

  return new Observable((subscriber) => {
    const executeUpload = async () => {
      try {
        // Stage 1: Get Signed URL (0-10%)
        subscriber.next({
          type: 'progress',
          stage: 'upload',
          percent: 5,
          loaded: 0,
          total: fileSize,
          lengthComputable: true,
        })

        if (!getSignedUrlEndpoint) {
          throw new Error('getSignedUrlEndpoint is not defined')
        }

        // Fetch signed URL
        const signedUrlResponse = await fetch(getSignedUrlEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            secret,
            fileName,
            bucketKey,
            bucketRegion,
            contentType: file.type,
          }),
          headers: {'Content-Type': 'application/json'},
          mode: 'cors',
        })

        const {url: signedUrl} = (await signedUrlResponse.json()) as {url: string}

        if (!signedUrl || !URL.canParse(signedUrl)) {
          throw new Error('Invalid signed URL received from endpoint')
        }

        // Stage 2: Upload to S3 (10-100%)
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Map 0-100% upload progress to 10-100% overall progress
            const uploadPercent = (event.loaded / event.total) * 100
            const overallPercent = 10 + uploadPercent * 0.9

            subscriber.next({
              type: 'progress',
              stage: 'upload',
              percent: overallPercent,
              loaded: event.loaded,
              total: event.total,
              lengthComputable: true,
            })
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Upload successful, emit final progress
            subscriber.next({
              type: 'progress',
              stage: 'upload',
              percent: 100,
              loaded: fileSize,
              total: fileSize,
              lengthComputable: true,
            })

            // Emit response event
            subscriber.next({
              type: 'response',
              method: 'PUT',
              statusCode: xhr.status,
              statusMessage: xhr.statusText,
              headers: {},
            })

            subscriber.complete()
          } else {
            subscriber.error(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => {
          subscriber.error(new Error('S3 upload failed: Network error'))
        }

        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', fileType)
        xhr.send(file)
      } catch (error) {
        subscriber.error(error)
      }
    }

    executeUpload()
  })
}

const deleteAsset = ({
  fileName,
  client,
}: {
  fileName: string
  client: S3Client | ObservableS3Client
}): Observable<HttpRequestEvent> => {
  const config = client.config()

  const {deleteEndpoint, secret, bucketKey, bucketRegion} = config

  if (!deleteEndpoint) {
    throw new Error('S3Client: Missing required config field: deleteEndpoint')
  }

  if (!fileName) {
    throw new Error('S3Client: fileKey is required in options')
  }

  return new Observable((subscriber) => {
    const executeDelete = async () => {
      try {
        const response = await fetch(deleteEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            fileKey: fileName,
            secret,
            bucketKey,
            bucketRegion,
          }),
          headers: {'Content-Type': 'application/json'},
          mode: 'cors',
        })

        if (!response.ok) {
          throw new Error(`S3 delete failed: ${response.status} ${response.statusText}`)
        }

        subscriber.next({
          type: 'response',
          method: 'POST',
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: {},
        })

        subscriber.complete()
      } catch (error) {
        subscriber.error(error)
      }
    }

    executeDelete()
  })
}

export class ObservableAssetsClient {
  #client: ObservableS3Client
  constructor(client: ObservableS3Client) {
    this.#client = client
  }

  uploadAsset({
    assetType,
    file,
    fileName,
  }: {
    file: File
    fileName: string
    assetType: S3AssetType
  }): Observable<HttpRequestEvent> {
    return upload({client: this.#client, file, fileName, assetType})
  }

  deleteAsset({fileName}: {fileName: string}): Observable<HttpRequestEvent> {
    return deleteAsset({client: this.#client, fileName})
  }
}

export class AssetsClient {
  #client: S3Client
  constructor(client: S3Client) {
    this.#client = client
  }

  uploadAsset({
    assetType,
    file,
    fileName,
  }: {
    assetType: S3AssetType
    file: File
    fileName: string
  }): Promise<ResponseEvent> {
    const observable = upload({client: this.#client, assetType, file, fileName})

    return lastValueFrom(observable.pipe(filter((event) => event.type === 'response')))
  }

  deleteAsset({fileName}: {fileName: string}): Promise<ResponseEvent> {
    const observable = deleteAsset({client: this.#client, fileName})

    return lastValueFrom(observable.pipe(filter((event) => event.type === 'response')))
  }
}
