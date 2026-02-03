import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type FC, useCallback} from 'react'

import {Button} from '../../../components'

interface InvalidImageWarningProps {
  onClearValue: () => void
}

export const InvalidImageWarning: FC<InvalidImageWarningProps> = (props) => {
  const {onClearValue} = props

  const handleClear = useCallback(() => {
    onClearValue()
  }, [onClearValue])

  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={3}>
        <Box>
          <Text size={2}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3} flex={1}>
          <Text size={1} weight="medium">
            Invalid image value
          </Text>
          <Text size={1}>
            The current value is not a valid image reference. This might be due to a schema change
            or data corruption.
          </Text>
          <Box>
            <Button onClick={handleClear} text="Clear value" tone="caution" mode="ghost" />
          </Box>
        </Stack>
      </Flex>
    </Card>
  )
}
