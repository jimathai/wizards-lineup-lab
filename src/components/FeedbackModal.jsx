import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const INITIAL_FORM = {
  name: '',
  email: '',
  category: 'Suggestion',
  message: '',
  website: '',
}

export default function FeedbackModal({ open, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!open) return undefined

    let active = true

    const autofillSignedInEmail = async () => {
      if (!supabase) return

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (!active || error || !user?.email || user.is_anonymous) return

      setForm((current) => (
        current.email
          ? current
          : { ...current, email: user.email }
      ))
    }

    autofillSignedInEmail()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('feedback-modal-open')

    return () => {
      active = false
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('feedback-modal-open')
    }
  }, [open, onClose])

  if (!open) return null

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    setFeedback('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pageUrl: window.location.href,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Unable to send your message.')
      }

      setStatus('sent')
      setFeedback('Thanks — your message was sent.')
      setForm(INITIAL_FORM)
    } catch (error) {
      setStatus('error')
      setFeedback(error.message || 'Unable to send your message.')
    }
  }

  return (
    <div className="feedback-modal-layer" role="presentation">
      <button
        type="button"
        className="feedback-modal-backdrop"
        aria-label="Close feedback form"
        onClick={onClose}
      />

      <section
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        <header className="feedback-modal-header">
          <div>
            <span>Help improve the lab</span>
            <h2 id="feedback-modal-title">Send Feedback</h2>
          </div>
          <button
            type="button"
            className="feedback-modal-close"
            aria-label="Close feedback form"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-form-two-column">
            <label>
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                maxLength={80}
                placeholder="Your name"
              />
            </label>

            <label>
              <span>Email <small>optional</small></span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                maxLength={160}
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label>
            <span>Category</span>
            <select name="category" value={form.category} onChange={updateField}>
              <option>Suggestion</option>
              <option>Bug</option>
              <option>Player Data</option>
              <option>Lineup Feedback</option>
              <option>Will Dawkins Appreciation</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Message</span>
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              minLength={5}
              maxLength={3000}
              rows={7}
              required
              placeholder="Tell us what you think..."
            />
          </label>

          <label className="feedback-honeypot" aria-hidden="true">
            Website
            <input
              name="website"
              value={form.website}
              onChange={updateField}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>

          {feedback && (
            <p className={`feedback-form-message feedback-form-message-${status}`}>
              {feedback}
            </p>
          )}

          <div className="feedback-form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
