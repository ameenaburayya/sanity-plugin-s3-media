/* eslint-disable no-dupe-class-members */
import {AssetsClient, ObservableAssetsClient} from './assets/AssetsClient'
import type {S3ClientConfig, HttpRequest, InitializedClientConfig} from './types'

/** @public */
export class ObservableS3Client {
  assets: ObservableAssetsClient

  /**
   * Private properties
   */
  #clientConfig: InitializedClientConfig
  #httpRequest: HttpRequest

  constructor(httpRequest: HttpRequest, config: S3ClientConfig) {
    // Initialize with empty object cast to InitializedClientConfig
    this.#clientConfig = {} as InitializedClientConfig
    this.config(config)

    this.#httpRequest = httpRequest

    this.assets = new ObservableAssetsClient(this)
  }

  /**
   * Clone the client - returns a new instance
   */
  clone(): ObservableS3Client {
    return new ObservableS3Client(this.#httpRequest, this.config())
  }

  /**
   * Returns the current client configuration
   */
  config(): InitializedClientConfig
  /**
   * Reconfigure the client. Note that this _mutates_ the current client.
   */
  config(newConfig?: Partial<S3ClientConfig>): this
  config(newConfig?: Partial<S3ClientConfig>): InitializedClientConfig | this {
    if (newConfig === undefined) {
      return {...this.#clientConfig}
    }

    // Merge config properly
    this.#clientConfig = {
      ...this.#clientConfig,
      ...newConfig,
    } as InitializedClientConfig

    return this
  }

  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig?: Partial<S3ClientConfig>): ObservableS3Client {
    const thisConfig = this.config()
    return new ObservableS3Client(this.#httpRequest, {
      ...thisConfig,
      ...newConfig,
    })
  }
}

/** @public */
export class S3Client {
  assets: AssetsClient

  /**
   * Observable version of the Sanity client, with the same configuration as the promise-based one
   */
  observable: ObservableS3Client

  /**
   * Private properties
   */
  #clientConfig: InitializedClientConfig
  #httpRequest: HttpRequest

  constructor(httpRequest: HttpRequest, config: S3ClientConfig) {
    // Initialize with empty object cast to InitializedClientConfig
    this.#clientConfig = {} as InitializedClientConfig
    this.config(config)

    this.#httpRequest = httpRequest

    this.assets = new AssetsClient(this)

    this.observable = new ObservableS3Client(httpRequest, config)
  }

  /**
   * Clone the client - returns a new instance
   */
  clone(): S3Client {
    return new S3Client(this.#httpRequest, this.config())
  }

  /**
   * Returns the current client configuration
   */
  config(): InitializedClientConfig
  /**
   * Reconfigure the client. Note that this _mutates_ the current client.
   */
  config(newConfig?: Partial<S3ClientConfig>): this
  config(newConfig?: Partial<S3ClientConfig>): InitializedClientConfig | this {
    if (newConfig === undefined) {
      return {...this.#clientConfig}
    }

    if (this.observable) {
      this.observable.config(newConfig)
    }

    // Merge config properly
    this.#clientConfig = {
      ...this.#clientConfig,
      ...newConfig,
    } as InitializedClientConfig

    return this
  }

  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig?: Partial<S3ClientConfig>): S3Client {
    const thisConfig = this.config()
    return new S3Client(this.#httpRequest, {
      ...thisConfig,
      ...newConfig,
    })
  }
}
