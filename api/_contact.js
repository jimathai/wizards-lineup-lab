const CONTACT_TO = 'districtgm@i9designs.com'
const ALLOWED_CATEGORIES = new Set([
  'Suggestion',
  'Bug',
  'Player Data',
  'Lineup Feedback',
  'Will Dawkins Appreciation',
  'Other',
])

const cleanText = (value, maxLength) =>
  String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const validEmail = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const sendContactMessage = async (payload = {}, metadata = {}) => {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.CONTACT_FROM_EMAIL
    || 'District Basketball Lab <onboarding@resend.dev>'

  if (!apiKey) {
    throw Object.assign(new Error('Contact email is not configured yet.'), {
      statusCode: 503,
    })
  }

  const name = cleanText(payload.name, 80) || 'Anonymous visitor'
  const email = cleanText(payload.email, 160)
  const category = ALLOWED_CATEGORIES.has(payload.category)
    ? payload.category
    : 'Other'
  const message = cleanText(payload.message, 3000)
  const pageUrl = cleanText(payload.pageUrl, 500)
  const website = cleanText(payload.website, 200)

  // Quietly accept automated submissions caught by the hidden field.
  if (website) return { ignored: true }

  if (message.length < 5) {
    throw Object.assign(new Error('Please enter a longer message.'), {
      statusCode: 400,
    })
  }

  if (!validEmail(email)) {
    throw Object.assign(new Error('Please enter a valid email address.'), {
      statusCode: 400,
    })
  }

  const submittedAt = new Date().toISOString()
  const subject = `[District Basketball Lab] ${category}`
  const replyTo = email || undefined
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#152238">
      <h2 style="margin-bottom:16px">District Basketball Lab Feedback</h2>
      <p><strong>Category:</strong> ${escapeHtml(category)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || 'Not provided')}</p>
      <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
      <p><strong>Page:</strong> ${escapeHtml(pageUrl || 'Not provided')}</p>
      <hr style="border:0;border-top:1px solid #d9e1eb;margin:20px 0" />
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': metadata.idempotencyKey || crypto.randomUUID(),
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [CONTACT_TO],
      reply_to: replyTo,
      subject,
      html,
    }),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error('Resend contact email failed:', result)
    throw Object.assign(
      new Error(result?.message || 'The email service rejected the message.'),
      { statusCode: 502 },
    )
  }

  return { id: result.id }
}
