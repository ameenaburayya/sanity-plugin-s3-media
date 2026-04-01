import {imageUrlToBlob} from '../imageUrlToBlob'

interface CanvasMock {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toBlob: (callback: (blob: Blob | null) => void, format?: string, quality?: number) => void
}

describe('imageUrlToBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads image data to canvas and resolves to a blob', async () => {
    const drawImage = vi.fn()
    const getContext = vi.fn(() => ({drawImage}))
    const blob = new Blob(['image-data'], {type: 'image/png'})

    const canvas: CanvasMock = {
      width: 0,
      height: 0,
      getContext,
      toBlob: (callback, _format, _quality) => callback(blob),
    }

    const createElement = vi.fn(() => canvas)

    vi.stubGlobal('document', {createElement} as unknown as Pick<Document, 'createElement'>)

    class ImageMock {
      static lastInstance: ImageMock | null = null
      width = 240
      height = 120
      crossOrigin = ''
      referrerPolicy = ''
      onload: null | (() => void) = null

      constructor() {
        ImageMock.lastInstance = this
      }

      set src(_value: string) {
        this.#srcValue = _value
        this.onload?.()
      }

      get src() {
        return this.#srcValue
      }

      #srcValue = ''
    }

    vi.stubGlobal('Image', ImageMock as unknown as typeof Image)

    const result = await imageUrlToBlob('https://cdn.example.com/photo.jpg', 'image/png', 0.75)

    expect(result).toBe(blob)
    expect(createElement).toHaveBeenCalledWith('canvas')
    expect(canvas.width).toBe(240)
    expect(canvas.height).toBe(120)
    expect(drawImage).toHaveBeenCalledWith(ImageMock.lastInstance, 0, 0, 240, 120)
    expect(ImageMock.lastInstance?.crossOrigin).toBe('anonymous')
    expect(ImageMock.lastInstance?.referrerPolicy).toBe('strict-origin-when-cross-origin')
  })

  it('rejects when canvas serialization throws', async () => {
    const canvas: CanvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({drawImage: vi.fn()})),
      toBlob: () => {
        throw new Error('canvas serialization failed')
      },
    }

    vi.stubGlobal('document', {
      createElement: vi.fn(() => canvas),
    } as unknown as Pick<Document, 'createElement'>)

    class ImageMock {
      width = 100
      height = 60
      crossOrigin = ''
      referrerPolicy = ''
      onload: null | (() => void) = null

      set src(_value: string) {
        this.#srcValue = _value
        this.onload?.()
      }

      get src() {
        return this.#srcValue
      }

      #srcValue = ''
    }

    vi.stubGlobal('Image', ImageMock as unknown as typeof Image)

    await expect(imageUrlToBlob('https://cdn.example.com/photo.jpg')).rejects.toThrow(
      'canvas serialization failed',
    )
  })
})
