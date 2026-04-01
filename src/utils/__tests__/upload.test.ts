import type {FormPatch} from 'sanity'
import {set as sanitySet} from 'sanity'

import {CLEANUP_EVENT, createInitialUploadEvent, createInitialUploadPatches, createUploadEvent} from '../upload'

type SanityPatchMock = {
  set: (...args: [unknown, string[]]) => {type: string; value?: unknown; path: string[]}
  unset: (...args: [string[]]) => {type: string; path: string[]}
}

const {set: setMock} = (globalThis as {
  __sanityMock: SanityPatchMock
}).__sanityMock

describe('upload utility helpers', () => {
  it('creates upload progress events', () => {
    expect(createUploadEvent()).toEqual({
      type: 'uploadProgress',
      patches: [],
    })

    const typedPatch: FormPatch = sanitySet('test-value', [])

    expect(createUploadEvent([typedPatch])).toEqual({
      type: 'uploadProgress',
      patches: [typedPatch],
    })
  })

  it('builds cleanup event from unset patch', () => {
    expect(CLEANUP_EVENT).toEqual({
      type: 'uploadProgress',
      patches: [{type: 'unset', path: ['_upload']}],
    })
  })

  it('creates initial upload patches and event with stable timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-01T12:00:00.000Z'))

    const file = new File(['x'], 'doc.txt', {type: 'text/plain'})

    const patches = createInitialUploadPatches(file)

    expect(setMock).toHaveBeenCalledWith(
      {
        progress: 2,
        createdAt: '2024-03-01T12:00:00.000Z',
        updatedAt: '2024-03-01T12:00:00.000Z',
        file: {name: 'doc.txt', type: 'text/plain'},
      },
      ['_upload'],
    )

    expect(patches).toEqual([
      {
        type: 'set',
        value: {
          progress: 2,
          createdAt: '2024-03-01T12:00:00.000Z',
          updatedAt: '2024-03-01T12:00:00.000Z',
          file: {name: 'doc.txt', type: 'text/plain'},
        },
        path: ['_upload'],
      },
    ])

    expect(createInitialUploadEvent(file)).toEqual({
      type: 'uploadProgress',
      patches,
    })
  })
})
