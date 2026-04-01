/* eslint-disable max-params */
import {Observable, of} from 'rxjs'
import {catchError, map, mergeMap} from 'rxjs/operators'
import {type SanityClient, type UploadOptions} from 'sanity'
import {
  type S3Asset,
  type S3AssetDocument,
  S3AssetType,
  type S3FileAsset,
  type S3ImageAsset,
  type S3VideoAsset,
} from 'sanity-plugin-s3-media-types'

import {type UploadCompleteEvent, type UploadEvent} from '../../types'
import {hashFile, withMaxConcurrency} from '../../utils'
import type {S3Client} from '../S3Client'

const MAX_CONCURRENT_UPLOADS = 4

interface ImageDimensions {
  width: number
  height: number
}

interface UploadAssetParams {
  sanityClient: SanityClient
  s3Client: S3Client
  assetType: S3AssetType
  file: File
  options?: UploadOptions
}

const fetchExistingAsset = (
  client: SanityClient,
  assetType: S3AssetType,
  id: string,
): Observable<S3ImageAsset | S3FileAsset | S3VideoAsset | null> =>
  client.observable.fetch(
    '*[_type == $documentType && _id == $id][0]',
    {documentType: `${assetType}Asset`, id},
    {tag: 's3Asset.find-duplicate'},
  )

const getImageDimensions = (file: File): Observable<ImageDimensions | null> => {
  if (!file.type.startsWith('image/')) {
    return of(null)
  }

  return new Observable<ImageDimensions>((subscriber) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    const cleanup = () => URL.revokeObjectURL(url)

    img.onload = () => {
      subscriber.next({width: img.width, height: img.height})
      subscriber.complete()
      cleanup()
    }

    img.onerror = () => {
      subscriber.error(new Error('Failed to load image'))
      cleanup()
    }

    img.src = url
  }).pipe(catchError(() => of(null)))
}

const getVideoDimensions = (file: File): Observable<ImageDimensions | null> => {
  if (!file.type.startsWith('video/')) {
    return of(null)
  }

  return new Observable<ImageDimensions>((subscriber) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      video.load()
    }

    video.onloadedmetadata = () => {
      subscriber.next({width: video.videoWidth, height: video.videoHeight})
      subscriber.complete()
      cleanup()
    }

    video.onerror = () => {
      subscriber.error(new Error('Failed to load video metadata'))
      cleanup()
    }

    video.preload = 'metadata'
    video.src = url
  }).pipe(catchError(() => of(null)))
}

const getFileExtension = (filename: string): string => {
  const segments = filename.split('.')

  return segments[segments.length - 1]
}

const buildFileName = (
  fileId: string,
  extension: string,
  dimensions: ImageDimensions | null,
): string =>
  dimensions
    ? `${fileId}-${dimensions.width}x${dimensions.height}.${extension}`
    : `${fileId}.${extension}`

const buildDocumentId = (
  assetType: S3AssetType,
  fileId: string,
  extension: string,
  dimensions: ImageDimensions | null,
): string =>
  assetType === S3AssetType.IMAGE && dimensions
    ? `${S3AssetType.IMAGE}-${fileId}-${dimensions.width}x${dimensions.height}-${extension}`
    : assetType === S3AssetType.VIDEO && dimensions
      ? `${S3AssetType.VIDEO}-${fileId}-${dimensions.width}x${dimensions.height}-${extension}`
      : `${S3AssetType.FILE}-${fileId}-${extension}`

const buildAssetDocument = (
  assetType: S3AssetType,
  fileId: string,
  file: File,
  documentId: string,
  hash: string | undefined,
  dimensions: ImageDimensions | null,
  storeOriginalFilename: boolean,
): S3Asset => {
  const baseDocument = {
    _id: documentId,
    _type:
      assetType === S3AssetType.IMAGE
        ? 's3ImageAsset'
        : assetType === S3AssetType.VIDEO
          ? 's3VideoAsset'
          : 's3FileAsset',
    assetId: fileId,
    originalFilename: storeOriginalFilename ? file.name : undefined,
    sha1hash: hash,
    extension: getFileExtension(file.name),
    mimeType: file.type,
    size: file.size,
  } as S3Asset

  if (assetType === S3AssetType.IMAGE && dimensions) {
    return {
      ...baseDocument,
      _type: 's3ImageAsset',
      metadata: {
        _type: 's3ImageMetadata',
        dimensions: {
          _type: 's3ImageDimensions',
          height: dimensions.height,
          width: dimensions.width,
          aspectRatio: dimensions.width / dimensions.height,
        },
      },
    }
  }

  if (assetType === S3AssetType.VIDEO && dimensions) {
    return {
      ...baseDocument,
      _type: 's3VideoAsset',
      metadata: {
        _type: 's3VideoMetadata',
        dimensions: {
          _type: 's3VideoDimensions',
          height: dimensions.height,
          width: dimensions.width,
          aspectRatio: dimensions.width / dimensions.height,
        },
      },
    }
  }

  return baseDocument
}

const createCompleteEvent = ({
  asset,
  exists,
}: {
  asset: S3AssetDocument
  exists?: boolean
}): UploadCompleteEvent => ({
  type: 'complete',
  id: asset._id,
  asset,
  exists,
})

// Main Upload Function
const uploadAsset = ({
  file,
  assetType,
  s3Client,
  sanityClient,
  options = {},
}: UploadAssetParams): Observable<UploadEvent> => {
  const {storeOriginalFilename = true} = options
  const extension = getFileExtension(file.name)

  return hashFile(file).pipe(
    mergeMap((hash) => {
      const dimensions$ =
        assetType === S3AssetType.IMAGE
          ? getImageDimensions(file)
          : assetType === S3AssetType.VIDEO
            ? getVideoDimensions(file)
            : of(null)

      return dimensions$.pipe(map((dimensions) => ({hash, dimensions})))
    }),

    mergeMap(({hash, dimensions}) => {
      if (assetType === S3AssetType.VIDEO && !dimensions) {
        throw new Error('Unable to determine video dimensions')
      }

      // Check for existing asset if we have a hash
      if (hash) {
        const documentId = buildDocumentId(assetType, hash, extension, dimensions)

        return fetchExistingAsset(sanityClient, assetType, documentId).pipe(
          map((existing) => ({existing, hash, dimensions, documentId})),
        )
      }

      return of({existing: null, hash, dimensions, documentId: ''})
    }),

    mergeMap(({existing, hash, dimensions, documentId}) => {
      // Return early if asset already exists
      if (existing) {
        return of(createCompleteEvent({asset: existing, exists: true}))
      }

      const fileName = buildFileName(hash, extension, dimensions)

      // Upload to S3 and create Sanity document
      return s3Client.observable.assets.uploadAsset({assetType, file, fileName}).pipe(
        mergeMap((event) => {
          if (event.type !== 'response') {
            return of(event as UploadEvent)
          }

          const document = buildAssetDocument(
            assetType,
            hash,
            file,
            documentId,
            hash || undefined,
            dimensions,
            storeOriginalFilename,
          )

          return sanityClient.observable
            .create<S3Asset>(document)
            .pipe(map((asset) => createCompleteEvent({asset})))
        }),
      )
    }),
  )
}

export const uploadS3Asset = withMaxConcurrency(uploadAsset, MAX_CONCURRENT_UPLOADS)
