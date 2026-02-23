import {firstValueFrom} from 'rxjs'

import {readExif} from '../readExif'

const exifMock = vi.hoisted(() => vi.fn())

vi.mock('exif-component', () => ({
  default: exifMock,
}))

function stubFileReader(
  behavior: 'success' | 'error',
  payload: ArrayBuffer | Error,
  readAsArrayBufferSpy?: ReturnType<typeof vi.fn>,
): void {
  class FileReaderMock {
    result: ArrayBuffer | null = null
    onerror: null | ((err: Error) => void) = null
    onload: null | (() => void) = null
    abort = vi.fn()

    readAsArrayBuffer = readAsArrayBufferSpy
      ? readAsArrayBufferSpy.mockImplementation((_buffer: ArrayBuffer) => {
          if (behavior === 'error') {
            this.onerror?.(payload as Error)
            return
          }

          this.result = payload as ArrayBuffer
          this.onload?.()
        })
      : (_buffer: ArrayBuffer) => {
          if (behavior === 'error') {
            this.onerror?.(payload as Error)
            return
          }

          this.result = payload as ArrayBuffer
          this.onload?.()
        }
  }

  vi.stubGlobal('window', {FileReader: FileReaderMock} as any)
}

describe('readExif', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads EXIF data from a sliced file buffer', async () => {
    const arrayBuffer = new ArrayBuffer(8)
    const readAsArrayBuffer = vi.fn()
    stubFileReader('success', arrayBuffer, readAsArrayBuffer)

    exifMock.mockReturnValue({orientation: 1})

    const slice = vi.fn(() => arrayBuffer)
    const file = {slice} as unknown as File

    const result = await firstValueFrom(readExif(file))

    expect(slice).toHaveBeenCalledWith(0, 128000)
    expect(readAsArrayBuffer).toHaveBeenCalledWith(arrayBuffer)
    expect(exifMock).toHaveBeenCalledWith(arrayBuffer)
    expect(result).toEqual({orientation: 1})
  })

  it('suppresses warnings for known EXIF failures', async () => {
    const arrayBuffer = new ArrayBuffer(8)
    stubFileReader('success', arrayBuffer)
    exifMock.mockImplementation(() => {
      throw new Error('No exif data')
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await firstValueFrom(readExif({slice: () => arrayBuffer} as unknown as File))

    expect(result).toEqual({})
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns for unexpected EXIF parser failures', async () => {
    const arrayBuffer = new ArrayBuffer(8)
    stubFileReader('success', arrayBuffer)
    exifMock.mockImplementation(() => {
      throw new Error('Corrupted EXIF payload')
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await firstValueFrom(readExif({slice: () => arrayBuffer} as unknown as File))

    expect(result).toEqual({})
    expect(warnSpy).toHaveBeenCalledWith(
      'Exif read failed, continuing anyway: Corrupted EXIF payload',
    )
  })

  it('handles file-reader failures and returns empty metadata', async () => {
    const fileReaderError = new Error('Reader failed')
    stubFileReader('error', fileReaderError)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await firstValueFrom(
      readExif({slice: () => new ArrayBuffer(8)} as unknown as File),
    )

    expect(result).toEqual({})
    expect(exifMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith('Exif read failed, continuing anyway: Reader failed')
  })
})
