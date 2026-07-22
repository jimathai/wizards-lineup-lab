# Anonymous saved lineups

1. In Supabase, enable **Authentication → Providers → Anonymous Sign-Ins**.
2. Run `supabase/anonymous_saved_lineups.sql` in the SQL Editor.
3. Copy the `src` files into the project.
4. Restart Vite.
5. Save or replace a lineup, refresh, and confirm it reloads.

Anonymous sessions persist in the browser's local storage. Clearing browser
storage or using another device creates a different anonymous user until
account-linking is added.
