import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type FC} from 'react'

import {Button} from '../../../components'

interface InvalidFileWarningProps {
  onClearValue: () => void
}

export const InvalidFileWarning: FC<InvalidFileWarningProps> = ({onClearValue}) => {
  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>

        <Stack space={3}>
          <Text size={1} weight="medium">
            Invalid file value
          </Text>
          <Text size={1}>
            The value of this field is not a valid file. Please reset this field.
          </Text>
        </Stack>
      </Flex>

      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearValue}
        text="Reset value"
        width="fill"
      />
    </Card>
  )
}
