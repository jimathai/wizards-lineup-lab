# Facebook previews for shared lineups

This patch makes the existing District GM shared URLs return lineup-specific Open Graph metadata and a generated 1200 × 630 preview image.

## Replace/add

- `api/_sharedLineupMeta.js`
- `api/share-page.js`
- `api/lineup-og.jsx`
- `vercel.json`

## Install and test

After copying the files:

```cmd
npm install @vercel/og
npm run build
```

Commit and push the changed files so Vercel deploys them.

The existing Vercel environment variables are reused:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

No custom domain and no additional secret are required.

## Preview URLs

Collection link:

```text
https://wizards-lineup-lab.vercel.app/lineups/<owner-id>/wizards
```

Single-lineup link:

```text
https://wizards-lineup-lab.vercel.app/lineup/<lineup-id>
```

The collection preview uses the first complete public five-player lineup and notes how many complete public lineups are available.

## Facebook cache

Facebook caches previews. After the deployment succeeds, paste the shared URL into Meta Sharing Debugger and choose **Scrape Again** if the old preview remains.
