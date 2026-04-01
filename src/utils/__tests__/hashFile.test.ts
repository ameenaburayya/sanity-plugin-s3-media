import {firstValueFrom} from 'rxjs'

import {hashFile as hashFileFromIndex} from '../file'
import {hashFile} from '../file/hashFile'

describe('hashFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hashes a file buffer using SHA-1 and returns hex output', async () => {
    const digest = vi.fn().mockResolvedValue(Uint8Array.from([0, 15, 255]).buffer)

    vi.stubGlobal('crypto', {subtle: {digest}})

    const file = new File([Uint8Array.from([1, 2, 3])], 'doc.bin', {
      type: 'application/octet-stream',
    })

    const hash = await firstValueFrom(hashFile(file))

    expect(digest).toHaveBeenCalledWith('SHA-1', await file.arrayBuffer())
    expect(hash).toBe('000fff')
  })

  it('is re-exported from utils/file index', () => {
    expect(hashFileFromIndex).toBe(hashFile)
  })
})
