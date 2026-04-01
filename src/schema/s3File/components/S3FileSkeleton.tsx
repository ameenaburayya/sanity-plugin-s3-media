import {Card, Flex, Skeleton} from '@sanity/ui'
import {type FC} from 'react'

export const S3FileSkeleton: FC = () => {
  return (
    <Card border padding={3} radius={2} data-testid="s3-file-skeleton">
      <Flex align="center" gap={3}>
        <Skeleton data-testid="skeleton-icon" style={{width: 35, height: 35}} radius={1} animated />
        <Flex direction="column" flex={1} gap={2}>
          <Skeleton data-testid="skeleton-primary" style={{width: '60%', height: 17}} radius={1} animated />
          <Skeleton data-testid="skeleton-secondary" style={{width: '40%', height: 15}} radius={1} animated />
        </Flex>
      </Flex>
    </Card>
  )
}
