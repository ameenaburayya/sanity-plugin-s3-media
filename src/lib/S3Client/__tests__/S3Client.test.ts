import {of} from 'rxjs'

import {AssetsClient, ObservableAssetsClient} from '../assets/AssetsClient'
import {ObservableS3Client, S3Client} from '../S3Client'

const baseConfig = {
  bucketRegion: 'us-east-1',
  bucketKey: 'media-bucket',
  getSignedUrlEndpoint: 'https://api.example.com/sign',
  deleteEndpoint: 'https://api.example.com/delete',
  secret: 'very-secret',
}

const createHttpRequest = () => {
  return vi.fn(() =>
    of({
      type: 'response',
      method: 'GET',
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
    } as any),
  )
}

describe('ObservableS3Client', () => {
  it('returns defensive copies from config()', () => {
    const client = new ObservableS3Client(createHttpRequest(), baseConfig)

    const config = client.config()
    config.bucketKey = 'mutated-locally'

    expect(client.config().bucketKey).toBe('media-bucket')
  })

  it('mutates config via shallow merge and returns this', () => {
    const client = new ObservableS3Client(createHttpRequest(), baseConfig)

    const result = client.config({cloudfrontDomain: 'cdn.example.com'})

    expect(result).toBe(client)
    expect(client.config()).toMatchObject({
      ...baseConfig,
      cloudfrontDomain: 'cdn.example.com',
    })
  })

  it('clone and withConfig return new independent client instances', () => {
    const client = new ObservableS3Client(createHttpRequest(), baseConfig)

    const clone = client.clone()
    const withConfig = client.withConfig({bucketRegion: 'eu-central-1'})

    expect(clone).toBeInstanceOf(ObservableS3Client)
    expect(clone).not.toBe(client)
    expect(clone.config()).toEqual(client.config())

    clone.config({bucketKey: 'clone-key'})
    expect(client.config().bucketKey).toBe('media-bucket')

    expect(withConfig).toBeInstanceOf(ObservableS3Client)
    expect(withConfig.config().bucketRegion).toBe('eu-central-1')
    expect(client.config().bucketRegion).toBe('us-east-1')
  })
})

describe('S3Client', () => {
  it('initializes assets and observable clients with provided config', () => {
    const httpRequest = createHttpRequest()
    const client = new S3Client(httpRequest, baseConfig)

    expect(client.assets).toBeInstanceOf(AssetsClient)
    expect(client.observable).toBeInstanceOf(ObservableS3Client)
    expect(client.observable.assets).toBeInstanceOf(ObservableAssetsClient)
    expect(client.config()).toMatchObject(baseConfig)
  })

  it('updates both sync and observable configs when reconfigured', () => {
    const client = new S3Client(createHttpRequest(), baseConfig)

    const result = client.config({cloudfrontDomain: 'cdn.example.com'})

    expect(result).toBe(client)
    expect(client.config()).toMatchObject({
      ...baseConfig,
      cloudfrontDomain: 'cdn.example.com',
    })
    expect(client.observable.config()).toMatchObject({
      ...baseConfig,
      cloudfrontDomain: 'cdn.example.com',
    })
  })

  it('clone creates a new independent client with copied config', () => {
    const client = new S3Client(createHttpRequest(), baseConfig)

    const clone = client.clone()

    expect(clone).toBeInstanceOf(S3Client)
    expect(clone).not.toBe(client)
    expect(clone.config()).toEqual(client.config())

    clone.config({bucketKey: 'clone-key'})
    expect(client.config().bucketKey).toBe('media-bucket')
  })

  it('withConfig creates a new client without mutating the original', () => {
    const client = new S3Client(createHttpRequest(), baseConfig)

    const newClient = client.withConfig({bucketRegion: 'ap-south-1'})

    expect(newClient).toBeInstanceOf(S3Client)
    expect(newClient).not.toBe(client)
    expect(newClient.config().bucketRegion).toBe('ap-south-1')
    expect(client.config().bucketRegion).toBe('us-east-1')
  })
})
