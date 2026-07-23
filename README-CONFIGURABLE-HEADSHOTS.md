# Configurable NBA Headshots

1. Run `supabase/configurable_nba_headshots.sql` in Supabase.
2. Add this locally to `.env.local`:

   `VITE_NBA_HEADSHOT_BASE_URL=https://cdn.nba.com/headshots/nba/latest/1040x760`

3. Add the same variable in Vercel for Production, Preview, and Development.
4. Redeploy after changing a Vite environment variable.

The app now resolves images in this order:

1. `players.image_url_override`
2. NBA CDN URL built from `players.nba_player_id`
3. legacy `players.image_url`

For custom artwork, update only `image_url_override`. Leave it null for standard NBA headshots.
