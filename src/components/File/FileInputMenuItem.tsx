import {type MenuItemProps} from '@sanity/ui'
import React, {type ChangeEvent, type FC, type HTMLProps, useCallback, useId} from 'react'
import styled from 'styled-components'

import {MenuItem} from '../UI'

const FileMenuItem = styled(MenuItem)`
  position: relative;

  & input {
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
`

type FileInputMenuItemProps = Omit<MenuItemProps, 'onSelect'> & {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

export const FileInputMenuItem: FC<
  FileInputMenuItemProps &
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
    [onSelect]
  )

  const renderMenuItem = useCallback(
    (item: React.JSX.Element) => (
      <div>
        {item}
        {/* Visibly hidden input */}
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
      </div>
    ),
    [accept, capture, disabled, handleChange, id, multiple]
  )

  return (
    <FileMenuItem
      {...rest}
      htmlFor={id}
      disabled={disabled}
      icon={icon}
      text={text}
      renderMenuItem={renderMenuItem}
    />
  )
}
