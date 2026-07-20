import { getLineupAnalytics } from '../utils/lineupAnalytics'

const getLastName = (name = '') => {
  const parts = name.trim().split(/\s+/)
  return parts.at(-1) || name
}

export default function LineupCompare({
  lineups,
  statMode,
  onSave,
  onRename,
  onSetStarters,
  selectedIndex,
  onSelect,
}) {
  return (
    <section className="compare-shell compare-shell-wide">
      <div className="compare-shell-head">
        <div>
          <span className="section-kicker">Saved Lineups</span>
        </div>
      </div>

      <div className="compare-card-grid compare-card-grid-wide">
        {lineups.map((lineup, index) => {
          const analytics = getLineupAnalytics(
            lineup.players,
            statMode,
          )

          const isSelected = selectedIndex === index

          return (
            <article
              className={`compare-card compare-card-wide selectable-lineup-card ${
                isSelected ? 'selected-lineup-card' : ''
              }`}
              key={index}
              onClick={() => onSelect(index)}
            >
              <div className="compare-card-top">
                <input
                  value={lineup.name}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    onRename(index, event.target.value)
                  }
                />

                <div className="compare-card-actions">
                  <button
                    type="button"
                    className="promote-lineup-button"
                    disabled={!lineup.players.length}
                    title={`Set ${lineup.name} as starters`}
                    aria-label={`Set ${lineup.name} as starters`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSetStarters(index)
                    }}
                  >
                    ☆
                  </button>

                  <strong className="compare-card-score">
                    {lineup.players.length
                      ? analytics.scores.overall
                      : '—'}
                  </strong>
                </div>
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onSave(index)
                  onSelect(index)
                }}
              >
                Save Current Five
              </button>

              <div className="compare-thumbnails">
                {lineup.players.length ? (
                  lineup.players.slice(0, 5).map((player) => (
                    <div
                      className="compare-player-thumb"
                      key={player.id}
                    >
                      <img
                        src={player.image}
                        alt={player.name}
                      />
                      <div className="compare-player-details">
                        <strong>{getLastName(player.name)}</strong>
                        <span>{player.pos || player.position || '—'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="compare-empty">
                    No lineup saved
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
