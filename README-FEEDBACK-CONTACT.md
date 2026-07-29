# Feedback / Contact Setup

The site now has a Feedback button and sends messages to:

`districtgm@i9designs.com`

## 1. Create a Resend account

Create an API key in Resend.

## 2. Verify i9designs.com

In Resend, add and verify `i9designs.com`. After verification, Resend allows
sending from an address on that domain.

A suggested sender is:

`District Basketball Lab <feedback@i9designs.com>`

The recipient remains `districtgm@i9designs.com`.

## 3. Add local environment variables

Add these server-only values to `.env.local`:

```
RESEND_API_KEY=re_your_key_here
CONTACT_FROM_EMAIL=District Basketball Lab <feedback@i9designs.com>
```

Do not prefix the API key with `VITE_`; it must remain server-only.

Restart Vite after changing `.env.local`:

```
npm run dev
```

## 4. Add Vercel environment variables

In Vercel, open Project Settings > Environment Variables and add:

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`

Apply them to Production, Preview, and Development as appropriate, then
redeploy. Environment variable changes do not affect an already-built
Vercel deployment.

## Files

- `src/components/FeedbackModal.jsx`
- `api/_contact.js`
- `api/contact.js`
- `src/App.jsx`
- `src/styles/district-basketball-lab.css`
- `vite.config.js`
