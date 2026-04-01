import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type FC} from 'react'

import {STALE_UPLOAD_MS} from '../../constants'
import {Button} from '../UI'

type UploadWarningProps = {
  onClearStale?: () => void
}

export const UploadWarning: FC<UploadWarningProps> = (props) => {
  const {onClearStale} = props
  const staleThresholdMinutes = Math.ceil(STALE_UPLOAD_MS / 1000 / 60)

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
            Incomplete upload
          </Text>
          <Text size={1}>
            {`An upload has made no progress for at least ${staleThresholdMinutes} minutes and likely got interrupted. You can safely clear the incomplete upload and try uploading again.`}
          </Text>
        </Stack>
      </Flex>

      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearStale}
        text="Clear upload"
        width="fill"
      />
    </Card>
  )
}
