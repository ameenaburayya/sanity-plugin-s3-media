import {createContext, type FC, type PropsWithChildren, useContext} from 'react'

type ContextProps = {
  open: () => void
}

type DropzoneDispatchProviderProps = {
  open: () => void
}

const DropzoneDispatchContext = createContext<ContextProps | undefined>(undefined)

export const DropzoneDispatchProvider: FC<PropsWithChildren<DropzoneDispatchProviderProps>> = (
  props
) => {
  const {children, open} = props

  const contextValue: ContextProps = {open}

  return (
    <DropzoneDispatchContext.Provider value={contextValue}>
      {children}
    </DropzoneDispatchContext.Provider>
  )
}

export const useDropzoneActions = () => {
  const context = useContext(DropzoneDispatchContext)
  if (context === undefined) {
    throw new Error('useDropzoneActions must be used within an DropzoneDispatchProvider')
  }
  return context
}
