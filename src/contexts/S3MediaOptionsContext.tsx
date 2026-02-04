import {createContext, type FC, PropsWithChildren, useContext} from 'react'

import type {S3MediaPluginOptions} from '../types'

type S3MediaOptionsContextProviderProps = {options: S3MediaPluginOptions | void}

const S3MediaOptionsContext = createContext<S3MediaPluginOptions>({
  directUploads: true,
})

export const S3MediaOptionsContextProvider: FC<
  PropsWithChildren<S3MediaOptionsContextProviderProps>
> = (props) => {
  const {options, children} = props

  const {directUploads = true, ...rest} = options || {}

  return (
    <S3MediaOptionsContext.Provider value={{...rest, directUploads}}>
      {children}
    </S3MediaOptionsContext.Provider>
  )
}

export const useS3MediaOptionsContext = (): S3MediaPluginOptions => {
  const context = useContext(S3MediaOptionsContext)

  if (!context) {
    throw new Error('useS3MediaOptionsContext must be used within a S3MediaOptionsContextProvider')
  }

  return context
}
