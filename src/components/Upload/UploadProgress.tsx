import {Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type FC, useEffect} from 'react'
import {LinearProgress, Translate, type UploadState, useTranslation} from 'sanity'
import styled from 'styled-components'

import {STALE_UPLOAD_MS} from '../../constants'
import {Button} from '../UI'

const FlexWrapper = styled(Flex)`
  box-sizing: border-box;
  text-overflow: ellipsis;
  overflow: hidden;
  overflow: clip;
`

const LeftSection = styled(Stack)`
  position: relative;
  width: 60%;
`

const CodeWrapper = styled(Code)`
  position: relative;
  width: 100%;

  code {
    overflow: hidden;
    overflow: clip;
    text-overflow: ellipsis;
    position: relative;
    max-width: 200px;
  }
`

interface UploadProgressProps {
  uploadState: UploadState
  onCancel?: () => void
  onStale?: () => void
}

const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

export const UploadProgress: FC<UploadProgressProps> = (props) => {
  const {uploadState, onCancel, onStale} = props
  const filename = uploadState.file.name

  useEffect(() => {
    if (elapsedMs(uploadState.updatedAt) > STALE_UPLOAD_MS) {
      onStale?.()
    }
  }, [uploadState.updatedAt, onStale])

  const {t} = useTranslation()

  return (
    <Card tone="primary" border>
      <FlexWrapper
        padding={4}
        align="center"
        justify="space-between"
        height="fill"
        direction="row"
        gap={2}
      >
        <LeftSection>
          <Flex justify="center" gap={[3, 3, 2, 2]} direction={['column', 'column', 'row']}>
            <Text size={1}>
              <Inline space={2}>
                <Translate
                  t={t}
                  i18nKey="input.files.common.upload-progress"
                  components={{
                    FileName: () => <CodeWrapper size={1}>{filename ? filename : '…'}</CodeWrapper>,
                  }}
                />
              </Inline>
            </Text>
          </Flex>

          <Card border marginTop={3} radius={5}>
            <LinearProgress value={uploadState.progress} />
          </Card>
        </LeftSection>

        {onCancel ? (
          <Button
            mode="ghost"
            onClick={onCancel}
            text={t('input.files.common.cancel-upload')}
            tone="critical"
          />
        ) : null}
      </FlexWrapper>
    </Card>
  )
}
