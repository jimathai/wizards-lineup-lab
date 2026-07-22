# Shareable saved lineups

1. Run `supabase/public_saved_lineup_sharing.sql` in Supabase SQL Editor.
2. Copy the included files into the project, preserving folders.
3. Restart Vite.
4. Save a lineup, click **Share**, and open the copied URL.
5. Deploy `vercel.json` with the app so direct `/lineup/<id>` visits route to Vite.

Only lineups whose `is_public` value is true are readable from a public link.
