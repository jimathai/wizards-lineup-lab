# Supabase Player Image Export Fix

Replace these files in the project:

- `api/image-proxy.js`
- `vite.config.js`

This adds `nujpcmyyewalanzqznxx.supabase.co` to the image proxy allowlist used by:

- the Vercel production API
- the local Vite development server

After copying the files, restart the local server:

```cmd
Ctrl + C
npm run dev
```

Then redeploy the project to Vercel so the production API function receives the same allowlist update.
