import { getSharedLineupMeta } from './_sharedLineupMeta.js'

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const getOrigin = (request) => {
  const host = request.headers['x-forwarded-host'] || request.headers.host
  const protocol = request.headers['x-forwarded-proto'] || 'https'
  return `${protocol}://${host}`
}

export default async function handler(request, response) {
  try {
    const origin = getOrigin(request)
    const { lineupId, ownerId, teamId } = request.query
    const meta = await getSharedLineupMeta({ lineupId, ownerId, teamId })

    const title = meta
      ? meta.isCollection
        ? `${meta.teamName} Shared Lineups | District GM`
        : `${meta.name} | District GM`
      : 'Shared Lineup | District GM'

    const description = meta
      ? meta.isCollection
        ? `See ${meta.collectionCount} fan-built ${meta.teamName} lineup${meta.collectionCount === 1 ? '' : 's'} on District GM.`
        : `See this fan-built ${meta.teamName} lineup on District GM.`
      : 'Build, save, and share Washington basketball lineups on District GM.'

    const canonicalPath = request.url.split('?')[0]
    const canonicalUrl = `${origin}${canonicalPath}`
    const imageQuery = lineupId
      ? `lineupId=${encodeURIComponent(lineupId)}`
      : `ownerId=${encodeURIComponent(ownerId)}&teamId=${encodeURIComponent(teamId)}`
    const imageUrl = `${origin}/api/lineup-og?${imageQuery}&v=2`

    const indexResponse = await fetch(`${origin}/index.html`)
    if (!indexResponse.ok) {
      throw new Error(`Unable to load application shell (${indexResponse.status}).`)
    }

    let html = await indexResponse.text()
    const tags = `
      <title>${escapeHtml(title)}</title>
      <meta name="description" content="${escapeHtml(description)}">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="District GM">
      <meta property="og:title" content="${escapeHtml(title)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
      <meta property="og:image" content="${escapeHtml(imageUrl)}">
      <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
      <meta property="og:image:type" content="image/png">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="${escapeHtml(meta?.name || 'District GM shared lineup')}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${escapeHtml(title)}">
      <meta name="twitter:description" content="${escapeHtml(description)}">
      <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
      <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    `

    html = html.replace(/<title>.*?<\/title>/is, '')
    html = html.replace('</head>', `${tags}</head>`)

    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=86400',
    )
    return response.status(200).send(html)
  } catch (error) {
    console.error('Shared lineup metadata failed:', error)
    return response.status(500).send('Unable to load the shared lineup page.')
  }
}
