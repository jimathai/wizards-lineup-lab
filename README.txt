DISTRICT BASKETBALL LAB — SAFE CSS CONSOLIDATION

Replace:
  src/App.jsx

Add:
  src/styles/district-basketball-lab.css

After confirming the page looks correct, delete these App-level files:
  src/ui-overhaul.css
  src/mockup-site.css
  src/site-layout-fixes.css
  src/featured-player.css
  src/player-focus-stat-layout.css
  src/player-card-layout-tweaks.css
  src/coach-board-player-cards.css
  src/card-accent-responsive-starters.css
  src/equal-height-court.css
  src/archetype-legend.css
  src/selectable-lineup-analytics.css
  src/district-v2-foundation.css
  src/swap-and-pool-zoom.css

DO NOT delete player-picker.css yet if PlayerPickerModal.jsx imports it directly.

Files that appear to be old Vite/legacy styles and are NOT included in the live
consolidated stylesheet:
  App.css
  index.css
  styles.css
  analytics.css
  compact-court.css
  court-image.css
  four-lineups.css
  layout-tweaks.css

Before deleting those legacy files, search the project for their filenames to
make sure no component still imports them.

Why this is called a safe consolidation:
  - The exact current stylesheet order is preserved.
  - Your local CSS changes are preserved.
  - No selectors were renamed.
  - No visual redesign is intentionally introduced.

The next refactor can split this master file into theme/layout/court/cards/panels
once this consolidated baseline is confirmed visually.
