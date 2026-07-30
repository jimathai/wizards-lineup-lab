import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchNbaPlayerStats } from './api/_nbaStats.js'
import { sendContactMessage } from './api/_contact.js'

const ALLOWED_IMAGE_HOSTS = new Set([
  'cdn.nba.com',
  'ak-static.cms.nba.com',
  'cdn.celtics.com',
  'pbs.twimg.com',
  'nujpcmyyewalanzqznxx.supabase.co',
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


const nbaStatsPlugin = () => ({
  name: 'district-nba-stats-api',
  configureServer(server) {
    server.middlewares.use('/api/nba-stats', async (request, response) => {
      try {
        const requestUrl = new URL(request.url, 'http://localhost')
        const season = requestUrl.searchParams.get('season') || '2025-26'
        const playerIds = (requestUrl.searchParams.get('playerIds') || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 30)
        const players = await fetchNbaPlayerStats(season, playerIds)

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ season, players }))
      } catch (error) {
        console.error('Development NBA stats API failed:', error)
        response.statusCode = 502
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({
          error: error?.name === 'AbortError'
            ? 'NBA.com did not respond before the request timed out.'
            : error?.message || 'Unable to retrieve NBA.com statistics.',
        }))
      }
    })
  },
})


const contactPlugin = () => ({
  name: 'district-contact-api',
  configureServer(server) {
    server.middlewares.use('/api/contact', async (request, response) => {
      if (request.method !== 'POST') {
        response.statusCode = 405
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: 'Method not allowed.' }))
        return
      }

      try {
        const chunks = []
        for await (const chunk of request) chunks.push(chunk)
        const payload = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        const result = await sendContactMessage(payload)
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ ok: true, ...result }))
      } catch (error) {
        console.error('Development contact API failed:', error)
        response.statusCode = error.statusCode || 500
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({
          error: error.message || 'Unable to send your message.',
        }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), imageProxyPlugin(), nbaStatsPlugin(), contactPlugin()],
  }
})
