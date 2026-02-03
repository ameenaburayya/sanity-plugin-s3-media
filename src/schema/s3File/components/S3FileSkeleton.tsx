import {Card, Flex, Skeleton} from '@sanity/ui'
import {type FC} from 'react'

export const S3FileSkeleton: FC = () => {
  return (
    <Card border padding={3} radius={2}>
      <Flex align="center" gap={3}>
        <Skeleton style={{width: 35, height: 35}} radius={1} animated />
        <Flex direction="column" flex={1} gap={2}>
          <Skeleton style={{width: '60%', height: 17}} radius={1} animated />
          <Skeleton style={{width: '40%', height: 15}} radius={1} animated />
        </Flex>
      </Flex>
    </Card>
  )
}
