import {Box, Text} from '@sanity/ui'
import type {FC} from 'react'
import {useDispatch} from 'react-redux'

import {useTypedSelector} from '../../../hooks'
import {AssetGridVirtualized} from '../AssetGridVirtualized'
import {AssetTableVirtualized} from '../AssetTableVirtualized'
import {assetsActions, selectCombinedItems} from '../../../modules'

export const Items: FC = () => {
  // Redux
  const dispatch = useDispatch()
  const fetchCount = useTypedSelector((state) => state.assets.fetchCount)
  const fetching = useTypedSelector((state) => state.assets.fetching)
  const view = useTypedSelector((state) => state.assets.view)
  const combinedItems = useTypedSelector(selectCombinedItems)

  const hasFetchedOnce = fetchCount >= 0
  const hasItems = combinedItems.length > 0

  // Only load 1 page of items at a time.
  const handleLoadMoreItems = () => {
    if (!fetching) {
      dispatch(assetsActions.loadNextPage())
    }
  }

  const isEmpty = !hasItems && hasFetchedOnce && !fetching

  return (
    <Box flex={1} style={{width: '100%'}}>
      {isEmpty ? (
        <Box padding={4}>
          <Text size={1} weight="semibold">
            No results for the current query
          </Text>
        </Box>
      ) : (
        <>
          {view === 'grid' && (
            <AssetGridVirtualized items={combinedItems} onLoadMore={handleLoadMoreItems} />
          )}

          {view === 'table' && (
            <AssetTableVirtualized items={combinedItems} onLoadMore={handleLoadMoreItems} />
          )}
        </>
      )}
    </Box>
  )
}
