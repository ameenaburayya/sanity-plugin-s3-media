import type {FC} from 'react'
import {VirtuosoGrid} from 'react-virtuoso'
import {styled} from 'styled-components'

import {useTypedSelector} from '../../../hooks'
import {CardAsset} from '../CardAsset'
import {CardUpload} from '../CardUpload'
import type {CardAssetData, CardUploadData} from '../../../types/browser'

type AssetGridVirtualizedProps = {
  items: (CardAssetData | CardUploadData)[]
  onLoadMore?: () => void
}

const CARD_HEIGHT = 220
const CARD_WIDTH = 240

const VirtualCell = ({
  item,
  selected,
}: {
  item: CardAssetData | CardUploadData
  selected: boolean
}) => {
  if (item?.type === 'asset') {
    return <CardAsset id={item.id} selected={selected} />
  }

  if (item?.type === 'upload') {
    return <CardUpload id={item.id} />
  }

  return null
}

const StyledItemContainer = styled.div`
  height: ${CARD_HEIGHT}px;
  width: ${CARD_WIDTH}px;
`

const StyledListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, ${CARD_WIDTH}px);
  grid-template-rows: repeat(auto-fill, ${CARD_HEIGHT}px);
  justify-content: center;
  margin: 0 auto;
`

export const AssetGridVirtualized: FC<AssetGridVirtualizedProps> = (props) => {
  const {items, onLoadMore} = props

  // Redux
  const selectedAssets = useTypedSelector((state) => state.selected.assets)

  const selectedIds = (selectedAssets && selectedAssets.map((asset) => asset._id)) || []
  const totalCount = items?.length

  if (totalCount === 0) {
    return null
  }

  return (
    <VirtuosoGrid
      className="media__custom-scrollbar"
      computeItemKey={(index) => {
        const item = items[index]

        return item?.id
      }}
      components={{
        Item: StyledItemContainer,
        List: StyledListContainer,
      }}
      endReached={onLoadMore}
      itemContent={(index) => {
        const item = items[index]
        const selected = selectedIds.includes(item?.id)

        return <VirtualCell item={item} selected={selected} />
      }}
      overscan={48}
      style={{overflowX: 'hidden', overflowY: 'scroll'}}
      totalCount={totalCount}
    />
  )
}
