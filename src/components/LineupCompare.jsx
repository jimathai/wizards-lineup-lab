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
  onUndo,
  onClear,
  onToggleVisibility,
  onShareLineups,
  selectedIndex,
  onSelect,
}) {
  return (
    <section className="compare-shell compare-shell-wide">
      <div className="compare-shell-head">
        <div>
          <span className="section-kicker">Saved Lineups</span>
        </div>

        <button
          type="button"
          className="share-lineups-button"
          onClick={onShareLineups}
        >
          Share Lineups
        </button>
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
                {index < 3 ? (
                  <strong className="fixed-lineup-name">
                    {lineup.name}
                  </strong>
                ) : (
                  <input
                    value={lineup.name}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      onRename(index, event.target.value)
                    }
                  />
                )}

                <div className="compare-card-actions">
                  <strong className="compare-card-score">
                    {lineup.players.length
                      ? analytics.scores.overall
                      : '—'}
                  </strong>

                  <button
                    type="button"
                    className="undo-lineup-button"
                    disabled={!lineup.canUndo}
                    title={`Restore the previous version of ${lineup.name}`}
                    aria-label={`Restore the previous version of ${lineup.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onUndo(index)
                    }}
                  >
                    ↶
                  </button>

                  <button
                    type="button"
                    className="promote-lineup-button"
                    disabled={!lineup.players.length}
                    title="Move to Lineup Editor"
                    aria-label={`Move ${lineup.name} to Lineup Editor`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSetStarters(index)
                    }}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    className="clear-saved-lineup-button"
                    disabled={!lineup.players.length}
                    title={`Clear ${lineup.name}`}
                    aria-label={`Clear ${lineup.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClear(index)
                    }}
                  >
                    ×
                  </button>

                </div>
              </div>

              <div className="compare-save-share-row">
                <button
                  className="compare-save-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSave(index)
                    onSelect(index)
                  }}
                >
                  {lineup.players.length ? 'Replace' : 'Save Current Five'}
                </button>

                <button
                  type="button"
                  className={`lineup-visibility-button ${
                    lineup.isPublic ? 'is-public' : 'is-private'
                  }`}
                  disabled={!lineup.players.length}
                  title={
                    lineup.isPublic
                      ? `Make ${lineup.name} private`
                      : `Make ${lineup.name} public`
                  }
                  aria-label={
                    lineup.isPublic
                      ? `Make ${lineup.name} private`
                      : `Make ${lineup.name} public`
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleVisibility(index)
                  }}
                >
                  <span aria-hidden="true">👁</span>
                  {lineup.isPublic ? 'Public' : 'Private'}
                </button>
              </div>

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
                        <span>{player.position || '—'}</span>
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
