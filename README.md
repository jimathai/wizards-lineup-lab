# Wizards Lineup Lab v3

## Run locally
Because the app fetches `players.json`, browsers may block it when opened directly from disk.

From this folder, run one of these:

### Python
`python -m http.server 8000`

Then open:
`http://localhost:8000`

### Visual Studio Code
Use the Live Server extension.

## API architecture
The UI calls `PlayerDataService` in `player-api.js`.

Today:
`./players.json`

Later:
`https://your-api.com/api/nba/teams/WAS/players`

That endpoint only needs to return the same JSON shape.

## v3 changes
- Half-court Starting Five with PG, SG, SF, PF, and C locations
- 2nd String and 3rd String remain five-card drag-and-drop units
- Bench remains underneath
- KAT removed
- Official NBA IDs added for AJ Dybantsa, Tre Johnson, Will Riley, Felix Okpara, Jamir Watkins, and Kyshawn George
- Default mode changed to 2025-26 Season
- Career Averages remains page-wide
- Players without NBA regular-season averages display a clear no-stats message

## Data caution
The architecture is production-friendly, but the complete PTS/REB/AST/STL/BLK dataset should be refreshed from a licensed or verified statistics API before public launch.
