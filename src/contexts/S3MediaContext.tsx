import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {
  createContext,
  type FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {createS3Client, type S3Client} from '../lib'
import {S3AssetType, type S3Credentials} from '../types'
import {buildS3FileUrl, buildS3ImageUrl} from '../utils/asset/paths'

type IS3MediaContext = {
  s3Client: S3Client
  buildAssetUrl: ({assetId, assetType}: {assetId: string; assetType: S3AssetType}) => string
}

const credentialsNamespace = 's3MediaCredentials'

const pluginConfigKeys = [
  {
    key: 'bucketRegion',
    title: 'Bucket Region',
  },
  {
    key: 'bucketKey',
    title: 'Bucket Key',
  },
  {key: 'getSignedUrlEndpoint', title: 'getSignedUrlEndpoint', description: 'test'},
  {key: 'deleteEndpoint', title: 'deleteEndpoint'},
  {key: 'cloudfrontDomain', title: 'cloudfrontDomain'},
  {key: 'secret', title: 'secret'},
]

const S3MediaContext = createContext<IS3MediaContext>({} as IS3MediaContext)

export const S3MediaContextProvider: FC<PropsWithChildren> = (props) => {
  const {children} = props

  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const {secrets: credentials, loading: isCredentialsLoading} =
    useSecrets<S3Credentials>(credentialsNamespace)

  const {bucketRegion, bucketKey, getSignedUrlEndpoint, deleteEndpoint, cloudfrontDomain, secret} =
    credentials || {}

  const s3AssetBaseUrl = useMemo(
    () =>
      cloudfrontDomain || (bucketRegion && bucketKey)
        ? cloudfrontDomain || `https://s3.${bucketRegion}.amazonaws.com/${bucketKey}`
        : null,
    [cloudfrontDomain, bucketRegion, bucketKey]
  )

  const s3Client = createS3Client({
    bucketRegion,
    bucketKey,
    getSignedUrlEndpoint,
    deleteEndpoint,
    cloudfrontDomain,
    secret,
  })

  const buildAssetUrl = useCallback(
    ({assetId, assetType}: {assetId: string; assetType: S3AssetType}) => {
      if (!assetId || !assetType) {
        throw new Error('')
      }

      if (!s3AssetBaseUrl) {
        return ''
      }

      if (assetType === S3AssetType.IMAGE) {
        return buildS3ImageUrl(assetId, {baseUrl: s3AssetBaseUrl})
      }

      if (assetType === S3AssetType.FILE) {
        return buildS3FileUrl(assetId, {baseUrl: s3AssetBaseUrl})
      }

      throw new Error('')
    },
    [s3AssetBaseUrl]
  )

  useEffect(() => {
    if (!isCredentialsLoading) {
      if (
        !credentials ||
        !credentials.bucketKey ||
        !credentials.bucketRegion ||
        !credentials.getSignedUrlEndpoint ||
        !credentials.secret
      ) {
        setIsCredentialsDialogOpen(true)
      } else {
        setIsCredentialsDialogOpen(false)
      }
    }
  }, [credentials, isCredentialsLoading])

  return (
    <S3MediaContext.Provider value={{s3Client, buildAssetUrl}}>
      {children}

      {isCredentialsDialogOpen && !isCredentialsLoading ? (
        <SettingsView
          title="S3 Media Credentials"
          namespace={credentialsNamespace}
          keys={pluginConfigKeys}
          onClose={() => {
            setIsCredentialsDialogOpen(false)
          }}
        />
      ) : null}
    </S3MediaContext.Provider>
  )
}

export const useS3MediaContext = (): IS3MediaContext => {
  const context = useContext(S3MediaContext)

  if (!context) {
    throw new Error('useS3MediaContext must be used within a S3MediaContextProvider')
  }

  return context
}
