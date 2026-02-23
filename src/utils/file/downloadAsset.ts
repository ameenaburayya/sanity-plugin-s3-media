const FALLBACK_FILENAME = 'download'

const CONTENT_DISPOSITION_FILENAME_STAR_RE = /filename\*\s*=\s*UTF-8''([^;]+)/i
const CONTENT_DISPOSITION_FILENAME_RE = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i

function resolveFileName(url: string, contentDispositionHeader?: string | null): string {
  const filenameStar = contentDispositionHeader?.match(CONTENT_DISPOSITION_FILENAME_STAR_RE)?.[1]
  if (filenameStar) {
    return decodeURIComponent(filenameStar)
  }

  const filename =
    contentDispositionHeader?.match(CONTENT_DISPOSITION_FILENAME_RE)?.[1] ||
    contentDispositionHeader?.match(CONTENT_DISPOSITION_FILENAME_RE)?.[2]
  if (filename) {
    return filename.trim()
  }

  try {
    const pathname = new URL(url).pathname
    const basename = pathname.split('/').pop()
    if (basename) {
      return decodeURIComponent(basename)
    }
  } catch {
    // Fall back to generic filename when URL parsing fails.
  }

  return FALLBACK_FILENAME
}

function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export async function downloadAsset(url?: string): Promise<void> {
  if (!url) {
    return
  }

  try {
    const response = await fetch(url, {method: 'GET'})
    if (!response.ok) {
      throw new Error(`Unexpected download response: ${response.status}`)
    }

    const contentDisposition = response.headers.get('content-disposition')
    const filename = resolveFileName(url, contentDisposition)
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)

    try {
      triggerDownload(objectUrl, filename)
    } finally {
      window.URL.revokeObjectURL(objectUrl)
    }
  } catch {
    triggerDownload(url, resolveFileName(url))
  }
}
