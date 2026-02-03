import type {FC} from 'react'
import {MediaBrowser} from './MediaBrowser'
import {Flex} from '@sanity/ui'

export const S3MediaTool: FC = () => {
  return (
    <Flex direction="column" height="fill" flex={1}>
      <MediaBrowser />
    </Flex>
  )
}
