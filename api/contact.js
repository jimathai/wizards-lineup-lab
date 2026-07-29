import { sendContactMessage } from './_contact.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  try {
    const body = typeof request.body === 'string'
      ? JSON.parse(request.body || '{}')
      : request.body || {}

    const result = await sendContactMessage(body, {
      idempotencyKey: request.headers['x-vercel-id']
        ? `feedback-${request.headers['x-vercel-id']}`.slice(0, 256)
        : undefined,
    })

    response.setHeader('Cache-Control', 'no-store')
    response.status(200).json({ ok: true, ...result })
  } catch (error) {
    console.error('Contact form failed:', error)
    response.status(error.statusCode || 500).json({
      error: error.message || 'Unable to send your message.',
    })
  }
}
