// @vitest-environment jsdom
import {downloadAsset} from '../downloadAsset'

const ensureObjectUrlApis = () => {
  if (!('createObjectURL' in URL)) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob://placeholder'),
    })
  }

  if (!('revokeObjectURL' in URL)) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  }
}

describe('downloadAsset', () => {
  it('returns early when url is empty', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await downloadAsset()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('downloads a fetched blob and resolves filename from content-disposition', async () => {
    ensureObjectUrlApis()

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://download')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn())

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-disposition': "attachment; filename*=UTF-8''my%20video.mp4",
      }),
      blob: vi.fn().mockResolvedValue(new Blob(['video-bytes'])),
    } as unknown as Response)

    await downloadAsset('https://cdn.example.com/assets/abc.mp4')

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob://download')
    expect(clickSpy).toHaveBeenCalledTimes(1)

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement

    expect(anchor.href).toBe('blob://download')
    expect(anchor.download).toBe('my video.mp4')
  })

  it('uses plain content-disposition filename when present', async () => {
    ensureObjectUrlApis()

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://download-plain')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn())

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-disposition': 'attachment; filename="  invoice.pdf  "',
      }),
      blob: vi.fn().mockResolvedValue(new Blob(['file-bytes'])),
    } as unknown as Response)

    await downloadAsset('https://cdn.example.com/files/ignored-name.txt')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement

    expect(anchor.download).toBe('invoice.pdf')
  })

  it('uses unquoted content-disposition filename when present', async () => {
    ensureObjectUrlApis()

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://download-unquoted')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn())

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-disposition': 'attachment; filename=transcript.txt',
      }),
      blob: vi.fn().mockResolvedValue(new Blob(['file-bytes'])),
    } as unknown as Response)

    await downloadAsset('https://cdn.example.com/files/ignored-name.txt')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement

    expect(anchor.download).toBe('transcript.txt')
  })

  it('falls back to direct url download when fetch fails', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch'))

    await downloadAsset('https://cdn.example.com/files/report.pdf?token=1')

    expect(clickSpy).toHaveBeenCalledTimes(1)

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement

    expect(anchor.href).toBe('https://cdn.example.com/files/report.pdf?token=1')
    expect(anchor.download).toBe('report.pdf')
  })

  it('falls back to generic filename for invalid URLs and non-ok responses', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers(),
      blob: vi.fn(),
    } as unknown as Response)

    await downloadAsset('://not-a-valid-url')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement

    expect(anchor.download).toBe('download')
  })
})
