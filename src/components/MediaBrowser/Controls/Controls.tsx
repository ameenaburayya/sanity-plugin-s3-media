import {Box, Flex, useMediaIndex} from '@sanity/ui'
import type {FC} from 'react'

import {useTypedSelector} from '../../../hooks'
import {ButtonViewGroup} from '../ButtonViewGroup'
import {OrderSelect} from '../OrderSelect'
import {Progress} from '../Progress'
import {TextInputSearch} from '../TextInputSearch'

export const Controls: FC = () => {
  // Redux
  const fetching = useTypedSelector((state) => state.assets.fetching)
  const pageIndex = useTypedSelector((state) => state.assets.pageIndex)

  const mediaIndex = useMediaIndex()

  return (
    <Box
      paddingY={2}
      style={{
        borderBottom: '1px solid var(--card-border-color)',
        zIndex: 2,
      }}
    >
      {/* Rows: search / filters / orders  */}
      <Box marginBottom={2}>
        <Flex
          align="flex-start"
          direction={['column', 'column', 'column', 'column', 'row']}
          justify="space-between"
        >
          {/* Search + Filters */}
          <Flex
            flex={1}
            style={{
              alignItems: 'flex-start',
              flex: 1,
              height: '100%',
              justifyContent: mediaIndex < 2 ? 'space-between' : 'flex-start',
              position: 'relative',
              width: '100%',
            }}
          >
            <Box marginX={2} style={{minWidth: '200px'}}>
              {/* Search */}
              <TextInputSearch />
            </Box>
          </Flex>
        </Flex>
      </Box>

      <Box>
        <Flex align="center" justify={['space-between']}>
          {/* Views */}
          <Box marginX={2}>
            <ButtonViewGroup />
          </Box>

          <Flex marginX={2}>
            {/* Orders */}
            <OrderSelect />
          </Flex>
        </Flex>
      </Box>

      {/* Progress bar */}
      <Progress key={pageIndex} loading={fetching} />
    </Box>
  )
}
