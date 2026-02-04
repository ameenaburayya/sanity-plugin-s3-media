import {type ChangeEvent, type FC, type HTMLProps, useCallback, useId} from 'react'
import {css, styled} from 'styled-components'

import {Button, type ButtonProps} from '../UI'

type FileInputButtonProps = ButtonProps & {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

const FileButton = styled(Button).attrs({forwardedAs: 'label'})(
  () => css`
    // The underlying file input is rendered as children within a Sanity UI <Button> component.
    // The below visibly hides it by targeting the input's parent <span> element, which is
    // added by the <Button> component.
    // TODO: refactor, avoid nth-child selector usage
    & > span:nth-child(2) {
      overflow: hidden;
      overflow: clip;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: 0;
      display: block;
      appearance: none;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0;
    }
  `,
)

export const FileInputButton: FC<
  FileInputButtonProps &
    Omit<HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>
> = (props) => {
  const {icon, id: idProp, accept, capture, multiple, onSelect, text, disabled, ...rest} = props
  const id = `${idProp || ''}-${useId()}`

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect],
  )

  return (
    <FileButton
      {...rest}
      space={2}
      padding={2}
      icon={icon}
      text={text}
      htmlFor={id}
      disabled={disabled}
    >
      <input
        accept={accept}
        capture={capture}
        id={id}
        multiple={multiple}
        onChange={handleChange}
        type="file"
        value=""
        disabled={disabled}
      />
    </FileButton>
  )
}
