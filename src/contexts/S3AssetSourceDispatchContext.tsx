import {createContext, type FC, type PropsWithChildren, useContext} from 'react'

import type {S3AssetSourceComponentProps} from '../types'

type ContextProps = {
  onSelect?: S3AssetSourceComponentProps['onSelect']
}

type AssetBrowserDispatchProviderProps = {
  onSelect?: S3AssetSourceComponentProps['onSelect']
}

const AssetSourceDispatchContext = createContext<ContextProps | undefined>(undefined)

export const AssetBrowserDispatchProvider: FC<
  PropsWithChildren<AssetBrowserDispatchProviderProps>
> = (props) => {
  const {children, onSelect} = props

  const contextValue: ContextProps = {
    onSelect,
  }

  return (
    <AssetSourceDispatchContext.Provider value={contextValue}>
      {children}
    </AssetSourceDispatchContext.Provider>
  )
}

export const useAssetSourceActions = () => {
  const context = useContext(AssetSourceDispatchContext)
  if (context === undefined) {
    throw new Error('useAssetSourceActions must be used within an AssetSourceDispatchProvider')
  }
  return context
}
