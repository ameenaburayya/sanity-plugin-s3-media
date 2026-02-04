import type {ThemeColorSchemeKey} from '@sanity/ui'
import {type MouseEvent} from 'react'
import {css, styled} from 'styled-components'

import {getSchemeColor} from '../../../utils'

type Props = {
  onClick?: (e: MouseEvent) => void
  $showCheckerboard?: boolean
  $scheme?: ThemeColorSchemeKey
  src: string
}

export const Image: any = styled.img<Props>`
  --checkerboard-color: ${(props) =>
    props.$scheme ? getSchemeColor(props.$scheme, 'bg2') : 'inherit'};

  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;

  ${(props) =>
    props.$showCheckerboard &&
    css`
      background-image: linear-gradient(45deg, var(--checkerboard-color) 25%, transparent 25%),
        linear-gradient(-45deg, var(--checkerboard-color) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--checkerboard-color) 75%),
        linear-gradient(-45deg, transparent 75%, var(--checkerboard-color) 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    `}
`
