import {SortIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import type {FC} from 'react'
import {useDispatch} from 'react-redux'

import {usePortalPopoverProps, useTypedSelector} from '../../../hooks'
import {getOrderTitle} from '../../../config/orders'
import {ORDER_OPTIONS} from '../../../constants'
import {assetsActions} from '../../../modules'

export const OrderSelect: FC = () => {
  // Redux
  const dispatch = useDispatch()
  const order = useTypedSelector((state) => state.assets.order)

  const popoverProps = usePortalPopoverProps()

  return (
    <MenuButton
      button={
        <Button fontSize={1} icon={SortIcon} mode="bleed" padding={3} text={getOrderTitle(order)} />
      }
      id="order"
      menu={
        <Menu>
          {ORDER_OPTIONS?.map((item, index) => {
            if (item) {
              const selected = order.field === item.field && order.direction === item.direction
              return (
                <MenuItem
                  disabled={selected}
                  fontSize={1}
                  iconRight={selected}
                  key={index}
                  onClick={() =>
                    dispatch(
                      assetsActions.orderSet({
                        order: {direction: item.direction, field: item.field},
                      })
                    )
                  }
                  padding={2}
                  selected={selected}
                  space={4}
                  style={{minWidth: '200px'}}
                  text={getOrderTitle(item)}
                />
              )
            }

            return <MenuDivider key={index} />
          })}
        </Menu>
      }
      popover={popoverProps}
    />
  )
}
