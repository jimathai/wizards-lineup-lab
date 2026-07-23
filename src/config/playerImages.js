const DEFAULT_NBA_HEADSHOT_BASE_URL =
  'https://cdn.nba.com/headshots/nba/latest/1040x760'

export const NBA_HEADSHOT_BASE_URL = (
  import.meta.env.VITE_NBA_HEADSHOT_BASE_URL ||
  DEFAULT_NBA_HEADSHOT_BASE_URL
).replace(/\/$/, '')

export const getNbaHeadshotUrl = (nbaPlayerId) => {
  if (nbaPlayerId == null || nbaPlayerId === '') return ''
  return `${NBA_HEADSHOT_BASE_URL}/${nbaPlayerId}.png`
}

export const resolvePlayerImageUrl = ({
  imageUrlOverride,
  nbaPlayerId,
  legacyImageUrl,
} = {}) =>
  imageUrlOverride ||
  getNbaHeadshotUrl(nbaPlayerId) ||
  legacyImageUrl ||
  ''
