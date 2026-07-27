import { toPng } from 'html-to-image'

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

const safeFileName = (value = 'lineup') =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lineup'


const downloadDataUrl = (dataUrl, fileName) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const proxiedImageUrl = (source) => {
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) {
    return source
  }

  const url = new URL(source, window.location.href)

  if (url.origin === window.location.origin) {
    return url.href
  }

  return `/api/image-proxy?url=${encodeURIComponent(url.href)}`
}

const waitForImage = (image) =>
  new Promise((resolve) => {
    if (image.complete) {
      resolve(image.naturalWidth > 0)
      return
    }

    const finish = (loaded) => {
      image.onload = null
      image.onerror = null
      resolve(loaded)
    }

    image.onload = () => finish(true)
    image.onerror = () => finish(false)
  })

const prepareImagesForCapture = async (node) => {
  const images = [...node.querySelectorAll('img')]
  const originals = images.map((image) => ({
    image,
    src: image.getAttribute('src'),
    crossOrigin: image.getAttribute('crossorigin'),
  }))

  await Promise.all(
    originals.map(async ({ image, src }) => {
      if (!src) return

      image.removeAttribute('crossorigin')
      image.src = proxiedImageUrl(src)

      const loaded = await waitForImage(image)
      if (!loaded) {
        image.src = TRANSPARENT_PIXEL
        await waitForImage(image)
      }
    }),
  )

  return () => {
    originals.forEach(({ image, src, crossOrigin }) => {
      if (src === null) image.removeAttribute('src')
      else image.setAttribute('src', src)

      if (crossOrigin === null) image.removeAttribute('crossorigin')
      else image.setAttribute('crossorigin', crossOrigin)
    })
  }
}

export async function downloadLineupImage({
  node,
  lineupName,
}) {
  if (!node) {
    throw new Error('The lineup image area is not available.')
  }

  const fileName = `${safeFileName(lineupName)}-lineup.png`
  const restoreImages = await prepareImagesForCapture(node)

  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      includeQueryParams: true,
      pixelRatio: 2,
      backgroundColor: '#08111f',
      imagePlaceholder: TRANSPARENT_PIXEL,
      filter: (element) =>
        !element?.classList?.contains('lineup-image-export-control'),
    })

    downloadDataUrl(dataUrl, fileName)
  } finally {
    restoreImages()
  }
}
