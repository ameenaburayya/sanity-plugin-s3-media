import {type TypedUseSelectorHook, useSelector} from 'react-redux'
import type {RootReducerState} from '../types'

export const useTypedSelector: TypedUseSelectorHook<RootReducerState> = useSelector
