const ALLOWED_HOSTS = new Set([
  'cdn.nba.com',
  'ak-static.cms.nba.com',
  'cdn.celtics.com',
  'pbs.twimg.com',
  'nujpcmyyewalanzqznxx.supabase.co',
])

const getRequestedUrl = (request) => {
  const rawUrl = Array.isArray(request.query?.url)
    ? request.query.url[0]
    : request.query?.url

  if (!rawUrl) return null

  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export default async function handler(request, response) {
  const imageUrl = getRequestedUrl(request)

  if (!imageUrl) {
    response.status(400).json({ error: 'Unsupported image URL.' })
    return
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 District-Basketball-Lab/1.0',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!upstream.ok) {
      response.status(upstream.status).end()
      return
    }

    const contentType = upstream.headers.get('content-type') || 'image/png'
    const body = Buffer.from(await upstream.arrayBuffer())

    response.setHeader('Content-Type', contentType)
    response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.status(200).send(body)
  } catch (error) {
    console.error('Image proxy failed:', error)
    response.status(502).json({ error: 'Unable to retrieve image.' })
  }
}
