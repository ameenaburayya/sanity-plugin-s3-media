import {configureStore} from '@reduxjs/toolkit'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {render, type RenderOptions} from '@testing-library/react'
import {type FC, type PropsWithChildren, type ReactElement} from 'react'
import {Provider} from 'react-redux'
import {ChangeIndicatorsTracker} from 'sanity'

import {
  AssetBrowserDispatchProvider,
  DropzoneDispatchProvider,
  S3MediaContextProvider,
  S3MediaOptionsContextProvider,
} from '../contexts'
import {rootReducer} from '../modules'
import type {RootReducerState, S3AssetSourceComponentProps, S3MediaPluginOptions} from '../types'

type Options = Omit<RenderOptions, 'wrapper'> & {
  onSelect?: S3AssetSourceComponentProps['onSelect']
  openDropzone?: () => void
  options?: S3MediaPluginOptions
  preloadedState?: Partial<RootReducerState>
}

const buildInitialState = (preloadedState?: Partial<RootReducerState>): RootReducerState => {
  const initial = rootReducer(undefined, {type: '@@INIT'})

  return {
    ...initial,
    ...preloadedState,
    assets: {
      ...initial.assets,
      ...preloadedState?.assets,
      byIds: {
        ...initial.assets.byIds,
        ...preloadedState?.assets?.byIds,
      },
    },
    dialog: {
      ...initial.dialog,
      ...preloadedState?.dialog,
    },
    notifications: {
      ...initial.notifications,
      ...preloadedState?.notifications,
    },
    search: {
      ...initial.search,
      ...preloadedState?.search,
    },
    selected: {
      ...initial.selected,
      ...preloadedState?.selected,
      assets: preloadedState?.selected?.assets ?? initial.selected.assets,
      documentAssetIds:
        preloadedState?.selected?.documentAssetIds ?? initial.selected.documentAssetIds,
    },
    uploads: {
      ...initial.uploads,
      ...preloadedState?.uploads,
      byIds: {
        ...initial.uploads.byIds,
        ...preloadedState?.uploads?.byIds,
      },
    },
  }
}

export const createTestStore = (preloadedState?: Partial<RootReducerState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: buildInitialState(preloadedState),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })

export const renderWithStore = (ui: ReactElement, options: Options = {}) => {
  const {
    onSelect,
    openDropzone = () => undefined,
    preloadedState,
    options: pluginOptions,
    ...rest
  } = options
  const store = createTestStore(preloadedState)

  const Wrapper: FC<PropsWithChildren> = ({children}) => (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <Provider store={store}>
            <ChangeIndicatorsTracker>
              <S3MediaOptionsContextProvider options={pluginOptions}>
                <S3MediaContextProvider>
                  <DropzoneDispatchProvider open={openDropzone}>
                    <AssetBrowserDispatchProvider onSelect={onSelect}>
                      {children}
                    </AssetBrowserDispatchProvider>
                  </DropzoneDispatchProvider>
                </S3MediaContextProvider>
              </S3MediaOptionsContextProvider>
            </ChangeIndicatorsTracker>
          </Provider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )

  return {
    store,
    ...render(ui, {wrapper: Wrapper, ...rest}),
  }
}
