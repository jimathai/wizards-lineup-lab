# NBA.com Stats Import

Copy the included files into the matching project folders.

No new npm package or SQL migration is required. Restart Vite because
`vite.config.js` changed.

Open `/admin`, select a team, and choose **Import NBA Stats**. Enter the
season, preview the matches, then apply the updates. Players must have a
valid `nba_player_id` to match.

Imported current-season fields: PTS, REB, AST, STL, BLK, TOV, 3PM, FG%,
3P%, FT%, +/-, and TS%. The data is written to `player_stats` with source
`NBA.com Stats`.
