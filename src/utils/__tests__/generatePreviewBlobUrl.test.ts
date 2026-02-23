import {firstValueFrom} from 'rxjs'

import {generatePreviewBlobUrl$} from '../mediaBrowser/generatePreviewBlobUrl'

type SetupOptions = {
  imageWidth: number
  imageHeight: number
  toBlobResult?: Blob | null
  throwOnGetContext?: Error
}

const setupPreviewDom = ({
  imageWidth,
  imageHeight,
  toBlobResult = new Blob(['preview'], {type: 'image/jpeg'}),
  throwOnGetContext,
}: SetupOptions) => {
  const createObjectURL = vi
    .fn()
    .mockImplementation((value: unknown) =>
      value instanceof File ? 'blob://large-image' : 'blob://preview-image',
    )
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('window', {URL: {createObjectURL, revokeObjectURL}} as any)

  const drawImage = vi.fn()
  const getContext = vi.fn(() => {
    if (throwOnGetContext) {
      throw throwOnGetContext
    }

    return {drawImage}
  })
  const toBlob = vi.fn((callback: (blob: Blob | null) => void) => callback(toBlobResult))

  const canvas = {
    width: 0,
    height: 0,
    getContext,
    toBlob,
  }

  const createElement = vi.fn(() => canvas)
  vi.stubGlobal('document', {createElement} as any)

  class ImageMock {
    static lastInstance: ImageMock | null = null

    width = imageWidth
    height = imageHeight
    onload: null | (() => void) = null

    constructor() {
      ImageMock.lastInstance = this
    }

    set src(_value: string) {
      this.onload?.()
    }
  }

  vi.stubGlobal('Image', ImageMock as any)

  return {
    createObjectURL,
    revokeObjectURL,
    drawImage,
    getContext,
    toBlob,
    canvas,
    ImageMock,
  }
}

describe('generatePreviewBlobUrl$', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a preview blob URL, revokes the source URL, and enforces minimum canvas height', async () => {
    const dom = setupPreviewDom({
      imageWidth: 36000,
      imageHeight: 1,
    })

    const file = new File(['image'], 'hero.png', {type: 'image/png'})

    const previewUrl = await firstValueFrom(generatePreviewBlobUrl$(file))

    expect(previewUrl).toBe('blob://preview-image')
    expect(dom.createObjectURL).toHaveBeenNthCalledWith(1, file)
    expect(dom.createObjectURL).toHaveBeenCalledTimes(2)
    expect(dom.revokeObjectURL).toHaveBeenCalledWith('blob://large-image')

    expect(dom.canvas.width).toBe(180)
    expect(dom.canvas.height).toBe(1)
    expect(dom.getContext).toHaveBeenCalledWith('2d')
    expect(dom.drawImage).toHaveBeenCalledWith(dom.ImageMock.lastInstance, 0, 0, 180, 0.005)
    expect(dom.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg')
  })

  it('throws when canvas.toBlob returns null', async () => {
    setupPreviewDom({
      imageWidth: 180,
      imageHeight: 90,
      toBlobResult: null,
    })

    const file = new File(['image'], 'hero.png', {type: 'image/png'})

    await expect(firstValueFrom(generatePreviewBlobUrl$(file))).rejects.toThrow(
      'Unable to generate file Blob',
    )
  })

  it('warns and throws when canvas context setup fails', async () => {
    const error = new Error('2D context unavailable')
    setupPreviewDom({
      imageWidth: 180,
      imageHeight: 90,
      throwOnGetContext: error,
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const file = new File(['image'], 'hero.png', {type: 'image/png'})

    await expect(firstValueFrom(generatePreviewBlobUrl$(file))).rejects.toThrow(
      'Unable to generate file Blob',
    )

    expect(warnSpy).toHaveBeenCalledWith('Unable to generate preview image:', error)
  })
})
