import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ALLOWED_IMAGE_HOSTS = new Set([
  'cdn.nba.com',
  'ak-static.cms.nba.com',
  'cdn.celtics.com',
  'pbs.twimg.com',
])

const imageProxyPlugin = () => ({
  name: 'district-image-proxy',
  configureServer(server) {
    server.middlewares.use('/api/image-proxy', async (request, response) => {
      try {
        const requestUrl = new URL(request.url, 'http://localhost')
        const rawImageUrl = requestUrl.searchParams.get('url')
        const imageUrl = rawImageUrl ? new URL(rawImageUrl) : null

        if (
          !imageUrl ||
          imageUrl.protocol !== 'https:' ||
          !ALLOWED_IMAGE_HOSTS.has(imageUrl.hostname)
        ) {
          response.statusCode = 400
          response.end('Unsupported image URL.')
          return
        }

        const upstream = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 District-Basketball-Lab/1.0',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        })

        if (!upstream.ok) {
          response.statusCode = upstream.status
          response.end()
          return
        }

        response.statusCode = 200
        response.setHeader(
          'Content-Type',
          upstream.headers.get('content-type') || 'image/png',
        )
        response.setHeader('Cache-Control', 'public, max-age=86400')
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.end(Buffer.from(await upstream.arrayBuffer()))
      } catch (error) {
        console.error('Development image proxy failed:', error)
        response.statusCode = 502
        response.end('Unable to retrieve image.')
      }
    })
  },
})

export default defineConfig({
  plugins: [react(), imageProxyPlugin()],
})
