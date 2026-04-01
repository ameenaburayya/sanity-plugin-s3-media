import * as matchers from '@testing-library/jest-dom/matchers'
import React from 'react'
import {afterEach, expect, vi} from 'vitest'
;

(globalThis as {React?: typeof React}).React = React

type ResizeObserverCallbackLike = (entries: object[]) => void
type ResizeObserverOptionsLike = {box?: string}
type IntersectionObserverCallbackLike = (entries: object[]) => void
type IntersectionObserverInitLike = {root?: Element | null}

type ResizeObserverConstructor = new (callback?: ResizeObserverCallbackLike) => {
  observe: (target: Element, options?: ResizeObserverOptionsLike) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}

type IntersectionObserverConstructor = new (
  callback?: IntersectionObserverCallbackLike,
  options?: IntersectionObserverInitLike,
) => {
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}

class MockResizeObserver {
  constructor(_callback?: ResizeObserverCallbackLike) {
    void _callback
  }

  observe(_target: Element, _options?: ResizeObserverOptionsLike) {
    void this
    void _target
    void _options
  }
  unobserve(_target: Element) {
    void this
    void _target
  }
  disconnect() {
    void this
  }
}

expect.extend(matchers)

class MockIntersectionObserver {
  constructor(_callback?: IntersectionObserverCallbackLike, _options?: IntersectionObserverInitLike) {
    void _callback
    void _options
  }

  observe(_target: Element) {
    void this
    void _target
  }
  unobserve(_target: Element) {
    void this
    void _target
  }
  disconnect() {
    void this
  }
}

if (!globalThis.ResizeObserver) {
  ;(globalThis as {ResizeObserver?: ResizeObserverConstructor}).ResizeObserver = MockResizeObserver
}

if (!globalThis.IntersectionObserver) {
  ;(globalThis as {IntersectionObserver?: IntersectionObserverConstructor}).IntersectionObserver =
    MockIntersectionObserver
}

const mockMatchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList

if (!globalThis.matchMedia) {
  ;(globalThis as {matchMedia?: (query: string) => MediaQueryList}).matchMedia = mockMatchMedia
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: mockMatchMedia,
  })
}

vi.mock('@sanity/uuid', () => ({
  uuid: () => 'generated-uuid',
}))

vi.mock('@sanity/studio-secrets', () => ({
  SettingsView: () => null,
  useSecrets: () => ({
    loading: false,
    secrets: {
      bucketKey: 'test-bucket',
      bucketRegion: 'us-east-1',
      cloudfrontDomain: 'https://cdn.example.com',
      deleteEndpoint: 'https://example.com/delete',
      getSignedUrlEndpoint: 'https://example.com/sign',
      secret: 'test-secret',
    },
  }),
}))

vi.mock('sanity/router', async () => {
  const actual = await vi.importActual<Record<string, object>>('sanity/router')

  return {
    ...actual,
    useIntentLink: () => ({
      href: '#',
      onClick: () => undefined,
    }),
    useRouter: () => ({navigate: () => undefined}),
  }
})

const observableFetchMock = vi.hoisted(() => {
  const mock = vi.fn()

  ;(globalThis as {__sanityObservableFetchMock?: ReturnType<typeof vi.fn>}).__sanityObservableFetchMock = mock
  return mock
})

type SanityMock = {
  set: ReturnType<typeof vi.fn>
  unset: ReturnType<typeof vi.fn>
  _isType: ReturnType<typeof vi.fn>
  definePlugin: ReturnType<typeof vi.fn>
}

const setMock = vi.fn((value: unknown, path: string[]) => ({
  type: 'set',
  value,
  path,
}))

const unsetMock = vi.fn((path: string[]) => ({type: 'unset', path}))

const isTypeMock = vi.fn((_schemaType: {name?: string}, schemaTypeName: string) =>
  _schemaType?.name === schemaTypeName,
)

const definePluginMock = vi.fn((factory: (prev: Record<string, unknown>) => Record<string, unknown>) => factory)

declare global {
  var __sanityMock: SanityMock
}

;(globalThis as {__sanityMock?: SanityMock}).__sanityMock = {
  set: setMock,
  unset: unsetMock,
  _isType: isTypeMock,
  definePlugin: definePluginMock,
}

const resetSanityMocks = () => {
  setMock
    .mockReset()
    .mockImplementation((value: unknown, path: string[]) => ({type: 'set', value, path}))
  unsetMock.mockReset().mockImplementation((path: string[]) => ({type: 'unset', path}))
  isTypeMock
    .mockReset()
    .mockImplementation((_schemaType: {name?: string}, schemaTypeName: string) =>
      _schemaType?.name === schemaTypeName,
    )
  definePluginMock.mockReset().mockImplementation(<T>(factory: T) => factory)
}

vi.mock('sanity', async () => {
  const actual = await vi.importActual<Record<string, object>>('sanity')
  const {of} = await import('rxjs')
  const subscription = {
    subscribe: () => ({
      unsubscribe: () => undefined,
    }),
  }

  const ContextMenuButton = React.forwardRef<
    HTMLButtonElement,
    React.HTMLProps<HTMLButtonElement>
  >((props, ref) =>
    React.createElement('button', {
      ...props,
      ref,
      type: 'button',
    }),
  )

  ContextMenuButton.displayName = 'ContextMenuButton'

  const MemberField = (props: {
    renderInput?: (input: {
      changed: boolean
      elementProps: {onFocus: () => void}
      focused: boolean
      path: string[]
    }) => React.ReactNode
    renderField?: (input: {children: React.ReactNode}) => React.ReactNode
  }) => {
    const renderedInput = props.renderInput?.({
      changed: false,
      elementProps: {onFocus: () => undefined},
      focused: false,
      path: ['asset'],
    })

    return props.renderField?.({children: renderedInput}) || renderedInput || null
  }

  return {
    ...actual,
    ContextMenuButton,
    MemberField,
    definePlugin: definePluginMock,
    set: setMock,
    unset: unsetMock,
    _isType: isTypeMock,
    Preview: ({value}: {value?: {title?: string; _id?: string; _type?: string}}) =>
      React.createElement('div', null, value?.title || value?._id || value?._type || 'preview'),
    WithReferringDocuments: ({
      children,
    }: {
      children:
        | React.ReactNode
        | ((
            props: {
              isLoading: boolean
              referringDocuments: {_id: string; _type: string; title: string}[]
            },
          ) => React.ReactNode)
    }) =>
      typeof children === 'function'
        ? children({
            isLoading: false,
            referringDocuments: [{_id: 'doc-1', _type: 'post', title: 'Doc'}],
          })
        : children,
    useClient: () => ({
      fetch: async () => [],
      listen: () => subscription,
      observable: {
        fetch: (...args: Parameters<typeof fetch>) => observableFetchMock(...args) ?? of({items: []}),
        listen: () => subscription,
        delete: () => of(undefined),
      },
      patch: () => ({
        setIfMissing: () => ({
          setIfMissing: () => ({
            set: () => ({
              commit: async () => ({}),
            }),
          }),
        }),
      }),
    }),
    useColorSchemeValue: () => 'light',
    useDocumentPreviewStore: () => ({}),
    useDocumentStore: () => ({}),
    useFormValue: () => ({_id: 'doc-1', _type: 'post'}),
    useSchema: () => ({
      get: () => ({name: 'post'}),
    }),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  resetSanityMocks()
})
