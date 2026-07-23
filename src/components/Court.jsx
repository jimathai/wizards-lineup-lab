import { useState } from 'react'
import PlayerCard from './PlayerCard'

const DEFAULT_POSITIONS = {
  PG: { x: 30, y: 17 },
  SG: { x: 70, y: 17 },
  SF: { x: 50, y: 49 },
  PF: { x: 27, y: 80 },
  C: { x: 73, y: 80 },
}

const SLOT_ORDER = ['PG', 'SG', 'SF', 'PF', 'C']

export default function Court({
  starters,
  statMode,
  onDropPlayer,
  onRemove,
  onOpenPicker,
  onSelectPlayer,
  onClear,
}) {
  const [viewMode, setViewMode] = useState('court')
  const positions = DEFAULT_POSITIONS

  return (
    <section className="mockup-court-panel lineup-editor-panel">
      <div className="mockup-court-header lineup-editor-header">
        <div className="lineup-editor-heading">
          <h2>Lineup Editor</h2>
          <button
            type="button"
            className="clear-lineup-button"
            onClick={onClear}
            disabled={!Object.values(starters).some(Boolean)}
          >
            Clear
          </button>
        </div>

        <div className="lineup-editor-header-controls">
          <div
            className="shared-view-toggle lineup-editor-view-toggle"
            role="group"
            aria-label="Lineup Editor display"
          >
            <button
              type="button"
              className={viewMode === 'court' ? 'active' : ''}
              onClick={() => setViewMode('court')}
            >
              Court
            </button>
            <button
              type="button"
              className={viewMode === 'card' ? 'active' : ''}
              onClick={() => setViewMode('card')}
            >
              Lineup Card
            </button>
          </div>

        </div>
      </div>

      {viewMode === 'court' ? (
        <div
          className="mockup-court-stage formation-2-1-2"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const id = Number(event.dataTransfer.getData('player-id'))
            if (id) onDropPlayer(id)
          }}
        >
          {Object.entries(starters).map(([slot, player]) => {
            const position = positions[slot]

            return (
              <div
                key={slot}
                className="mockup-court-slot"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.stopPropagation()
                  const id = Number(event.dataTransfer.getData('player-id'))
                  if (id) onDropPlayer(id, slot)
                }}
              >
                {player ? (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    statMode={statMode}
                    onRemove={() => onRemove(slot)}
                    onSelect={onSelectPlayer}
                  />
                ) : (
                  <button
                    className="mockup-plus"
                    onClick={(event) =>
                      onOpenPicker(
                        { type: 'starter', slot },
                        event.currentTarget.getBoundingClientRect(),
                      )
                    }
                  >
                    +
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="shared-lineup-card-view lineup-editor-card-view">
          <div className="shared-lineup-card-players">
            {SLOT_ORDER.map((slot) => {
              const player = starters[slot]

              if (!player) {
                return (
                  <button
                    type="button"
                    className="shared-lineup-player-tile lineup-editor-empty-card"
                    key={slot}
                    onClick={(event) =>
                      onOpenPicker(
                        { type: 'starter', slot },
                        event.currentTarget.getBoundingClientRect(),
                      )
                    }
                  >
                    <span className="lineup-editor-empty-plus">+</span>
                    <strong>{slot}</strong>
                    <small>Add Player</small>
                  </button>
                )
              }

              return (
                <article
                  className="shared-lineup-player-tile lineup-editor-player-tile"
                  key={slot}
                  onClick={() => onSelectPlayer(player.id)}
                >
                  <button
                    type="button"
                    className="lineup-editor-card-remove"
                    aria-label={`Remove ${player.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(slot)
                    }}
                  >
                    ×
                  </button>

                  <div className="shared-lineup-player-image">
                    <img src={player.image} alt={player.name} />
                  </div>

                  <div className="shared-lineup-player-copy">
                    <strong>{player.name}</strong>

                    <div className="shared-player-meta">
                      <span>
                        {player.number === '' || player.number == null
                          ? '—'
                          : `#${player.number}`}
                      </span>
                      <span>{player.pos || player.position || slot}</span>
                    </div>

                    <small>{player.archetype || 'Player'}</small>

                    <div className="shared-lineup-player-stats">
                      <span>
                        Pts
                        <strong>{player[statMode]?.pts ?? '—'}</strong>
                      </span>
                      <span>
                        Reb
                        <strong>{player[statMode]?.reb ?? '—'}</strong>
                      </span>
                      <span>
                        Ast
                        <strong>{player[statMode]?.ast ?? '—'}</strong>
                      </span>
                    </div>

                    <div className="shared-lineup-player-stats lineup-editor-bio-stats">
                      <span>
                        Ht
                        <strong>{player.height ?? '—'}</strong>
                      </span>
                      <span>
                        Wt
                        <strong>{player.weight ?? '—'}</strong>
                      </span>
                      <span>
                        Exp
                        <strong>
                          {player.experience == null
                            ? '—'
                            : player.experience === 0
                              ? 'R'
                              : player.experience}
                        </strong>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
