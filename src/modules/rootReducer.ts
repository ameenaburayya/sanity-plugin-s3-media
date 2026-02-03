import {
  type ActionFromReducersMapObject,
  combineReducers,
  type Reducer,
  type StateFromReducersMapObject,
} from '@reduxjs/toolkit'

import {assetsReducer} from './assets'
import {dialogReducer} from './dialog'
import {notificationsReducer} from './notifications'
import {searchReducer} from './search'
import {selectedReducer} from './selected'
import {uploadsReducer} from './uploads'

const reducers = {
  assets: assetsReducer,
  dialog: dialogReducer,
  notifications: notificationsReducer,
  search: searchReducer,
  selected: selectedReducer,
  uploads: uploadsReducer,
}

type ReducersMapObject = typeof reducers

export const rootReducer: Reducer<
  StateFromReducersMapObject<ReducersMapObject>,
  ActionFromReducersMapObject<ReducersMapObject>
> = combineReducers(reducers)
