const STORAGE_KEY = 'district-basketball-lab-v2'
const LEGACY_STORAGE_KEY = 'wll-react-v2'

const encodePayload = (payload) => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return window.btoa(binary)
}

const decodePayload = (encoded) => {
  const binary = window.atob(encoded)
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  )

  return JSON.parse(new TextDecoder().decode(bytes))
}

export const loadProject = () => {
  try {
    const encoded = new URLSearchParams(window.location.search).get(
      'lineup',
    )

    if (encoded) {
      return decodePayload(encoded)
    }

    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY) ||
        'null',
    )
  } catch {
    return null
  }
}

export const saveProjectToStorage = (project) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export const createShareUrl = (project) => {
  const encoded = encodeURIComponent(encodePayload(project))

  return (
    `${window.location.origin}${window.location.pathname}` +
    `?lineup=${encoded}`
  )
}
