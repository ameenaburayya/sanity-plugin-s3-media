/* eslint-disable no-undef */
/* eslint-disable react-hooks/rules-of-hooks */
import {
  type ClipboardEvent,
  type ComponentType,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {FileInfo} from '../../types'
import {imageUrlToBlob} from '../../utils'

const extractDroppedFiles = async (dataTransfer: DataTransfer): Promise<File[]> => {
  return Array.from(dataTransfer.files)
}

const extractPastedFiles = async (clipboardData: DataTransfer): Promise<File[]> => {
  return Array.from(clipboardData.files)
}

type CamelToKebab<S extends string> = S extends `${infer P1}${infer P2}`
  ? P2 extends Uncapitalize<P2>
    ? `${Lowercase<P1>}${CamelToKebab<P2>}`
    : `${Lowercase<P1>}-${CamelToKebab<Uncapitalize<P2>>}`
  : S

type DataAttribute<S extends string> = `data-${CamelToKebab<S>}`

const fileTargetAttributeName = 'isFileTarget'
const fileTargetDataAttribute: Record<DataAttribute<typeof fileTargetAttributeName>, 'true'> = {
  'data-is-file-target': 'true',
}

// this is a hack for Safari that reads pasted image(s) from an ContentEditable div instead of the onpaste event
const convertImagesToFilesAndClearContentEditable = (
  element: HTMLElement,
  targetFormat = 'image/jpeg'
): Promise<File[]> => {
  if (!element.isContentEditable) {
    return Promise.reject(
      new Error(
        `Expected element to be contentEditable="true". Instead found a non contenteditable ${element.tagName}`
      )
    )
  }
  return new Promise((resolve) => setTimeout(resolve, 10)) // add a delay so the paste event can finish
    .then(() => Array.from(element.querySelectorAll('img')))
    .then((imageElements) => {
      element.innerHTML = '' // clear
      return imageElements
    })
    .then((images) => Promise.all(images.map((img) => imageUrlToBlob(img.src))))
    .then((imageBlobs) =>
      imageBlobs.map((blob) => new File([blob!], 'pasted-image.jpg', {type: targetFormat}))
    )
}

// needed by Edge
const select = (el: Element) => {
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

type Props = {
  onFiles?: (files: File[]) => void
  onFilesOver?: (files: FileInfo[]) => void
  onFilesOut?: () => void
  pasteTarget?: HTMLElement
  disabled?: boolean
}

type ManagedProps =
  | 'onDrop'
  | 'onDragOver'
  | 'onPaste'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onKeyDown'

const PASTE_INPUT_STYLE = {opacity: 0, position: 'absolute'} as const

export function UploadFileTarget<ComponentProps>(Component: ComponentType<ComponentProps>) {
  // eslint-disable-next-line react/display-name
  return (props: Omit<ComponentProps, ManagedProps> & Props) => {
    const {onFiles, onFilesOver, onFilesOut, pasteTarget, disabled, ...rest} = props
    const [showPasteInput, setShowPasteInput] = useState(false)

    const pasteInput = useRef<HTMLDivElement | null>(null)
    const ref = useRef<HTMLElement | null>(null)

    const enteredElements = useRef<Element[]>([])

    const emitFiles = useCallback(
      (files: File[]) => {
        onFiles?.(files)
      },
      [onFiles]
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (
          !pasteTarget &&
          event.target === ref.current &&
          (event.ctrlKey || event.metaKey) &&
          event.key === 'v'
        ) {
          setShowPasteInput(true)
        }
      },
      [pasteTarget]
    )

    const handlePaste = useCallback(
      (event: ClipboardEvent) => {
        void extractPastedFiles(event.clipboardData)
          .then((files) => {
            if (pasteTarget) {
              return files
            }
            if (!pasteInput.current) {
              return []
            }
            return files.length > 0
              ? files
              : // Invoke Safari hack if we didn't get any files
                convertImagesToFilesAndClearContentEditable(pasteInput.current, 'image/jpeg')
          })
          .then((files) => {
            emitFiles(files)
            if (!pasteTarget) {
              setShowPasteInput(false)
              ref.current?.focus()
            }
          })
      },
      [emitFiles, pasteTarget]
    )

    useEffect(() => {
      if (pasteTarget) {
        const pasteTargetElementListener = (event: globalThis.ClipboardEvent) => {
          // Some applications may put both text and files on the clipboard when content is copied (Word, Excel etc).
          // If we have both text and html on the clipboard, the intention is probably to paste text, so ignore the files.
          const hasHtml = !!event.clipboardData?.getData('text/html')
          const hasText = !!event.clipboardData?.getData('text/plain')
          if (hasHtml && hasText) {
            console.warn(
              'Clipboard contains both text and HTML, ignoring additional file data on the clipboard.'
            )
            return
          }
          handlePaste(event as unknown as ClipboardEvent)
        }
        pasteTarget.addEventListener('paste', pasteTargetElementListener)
        return () => {
          pasteTarget.removeEventListener('paste', pasteTargetElementListener)
        }
      }
      return undefined
    }, [pasteTarget, handlePaste])

    const handleDrop = useCallback(
      (event: DragEvent) => {
        enteredElements.current = []

        event.preventDefault()
        event.stopPropagation()
        const dataTransfer = event.nativeEvent.dataTransfer

        if (onFiles && dataTransfer) {
          void extractDroppedFiles(dataTransfer).then((files) => {
            if (files) {
              emitFiles(files)
            }
          })
        }
        onFilesOut?.()
      },
      [emitFiles, onFiles, onFilesOut]
    )

    const handleDragOver = useCallback(
      (event: DragEvent) => {
        if (onFiles) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
      [onFiles]
    )

    const handleDragEnter = useCallback(
      (event: DragEvent) => {
        const fileTypes = Array.from(event.dataTransfer.items).map((item) => ({
          type: item.type,
          kind: item.kind,
        }))

        event.stopPropagation()

        if (onFilesOver && ref.current === event.currentTarget) {
          /* this is a (hackish) work around to have the drag and drop work when the file is hovered back and forth over it
          as part of the refactor and adding more components to the "hover" state, it didn't recognise that it just kept adding the same
          element over and over, so when it tried to remove them on the handleDragLeave, it only removed the last instance.
        */
          enteredElements.current = [...new Set(enteredElements.current), event.currentTarget]

          onFilesOver(fileTypes)
        }
      },
      [onFilesOver]
    )

    const handleDragLeave = useCallback(
      (event: DragEvent) => {
        event.stopPropagation()
        const idx = enteredElements.current.indexOf(event.currentTarget)
        if (idx > -1) {
          enteredElements.current.splice(idx, 1)
        }
        if (enteredElements.current.length === 0) {
          onFilesOut?.()
        }
      },
      [onFilesOut]
    )

    const prevShowPasteInput = useRef(false)

    useEffect(() => {
      if (!prevShowPasteInput.current && showPasteInput && pasteInput.current) {
        pasteInput.current.focus()
        select(pasteInput.current) // Needed by Edge
      } else if (prevShowPasteInput.current && !showPasteInput) {
        pasteInput.current?.focus()
      }
      prevShowPasteInput.current = showPasteInput
    }, [pasteTarget, showPasteInput])

    return (
      <>
        <Component
          {...(rest as ComponentProps)}
          ref={ref}
          onKeyDown={disabled ? undefined : handleKeyDown}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragEnter={disabled ? undefined : handleDragEnter}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
          {...fileTargetDataAttribute}
        />
        {!disabled && showPasteInput && (
          <div contentEditable onPaste={handlePaste} ref={pasteInput} style={PASTE_INPUT_STYLE} />
        )}
      </>
    )
  }
}
