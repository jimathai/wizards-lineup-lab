import { useState } from 'react'
import PlayerCard from './PlayerCard'

const DEFAULT_POSITIONS = {
  PG: { x: 36, y: 17 },
  SG: { x: 64, y: 17 },
  SF: { x: 50, y: 49 },
  PF: { x: 36, y: 80 },
  C: { x: 64, y: 80 },
}

const SLOT_ORDER = ['PG', 'SG', 'SF', 'PF', 'C']
const NARROW_SCREEN_QUERY = '(max-width: 900px)'

const getInitialViewMode = () => {
  if (typeof window === 'undefined') return 'court'
  return window.matchMedia(NARROW_SCREEN_QUERY).matches
    ? 'list'
    : 'court'
}

const getDraggedPlayerId = (event) => {
  const playerId = Number(event.dataTransfer.getData('player-id'))
  return Number.isFinite(playerId) && playerId ? playerId : null
}

const getExperience = (player) => {
  if (player.experience == null) return '—'
  return player.experience === 0 ? 'R' : player.experience
}

function EmptyLineupSlot({ slot, view, onOpenPicker, onDropPlayer }) {
  const openPicker = (event) =>
    onOpenPicker(
      { type: 'starter', slot },
      event.currentTarget.getBoundingClientRect(),
    )

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const playerId = getDraggedPlayerId(event)
    if (playerId) onDropPlayer(playerId, slot)
  }

  if (view === 'list') {
    return (
      <button
        type="button"
        className="lineup-editor-list-row lineup-editor-list-empty"
        onClick={openPicker}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="lineup-editor-list-slot">{slot}</span>
        <span className="lineup-editor-list-empty-plus">+</span>
        <span>
          <strong>Add Player</strong>
          <small>Click or drop a player here</small>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="shared-lineup-player-tile lineup-editor-empty-card"
      onClick={openPicker}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="lineup-editor-empty-plus">+</span>
      <strong>{slot}</strong>
      <small>Add Player</small>
    </button>
  )
}

function HorizontalLineupPlayer({
  player,
  slot,
  statMode,
  onDropPlayer,
  onRemove,
  onSelectPlayer,
}) {
  const stats = player[statMode] || {}

  return (
    <article
      className="lineup-editor-list-row lineup-editor-list-player"
      draggable
      onClick={() => onSelectPlayer(player.id)}
      onDragStart={(event) =>
        event.dataTransfer.setData('player-id', String(player.id))
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const playerId = getDraggedPlayerId(event)
        if (playerId) onDropPlayer(playerId, slot)
      }}
    >
      <span className="lineup-editor-list-slot">{slot}</span>

      <div className="lineup-editor-list-image">
        <img src={player.image} alt={player.name} />
      </div>

      <div className="lineup-editor-list-copy">
        <div className="lineup-editor-list-identity">
          <strong>{player.name}</strong>
          <span>
            {player.number === '' || player.number == null
              ? '—'
              : `#${player.number}`}
            {' · '}
            {player.pos || player.position || slot}
          </span>
          <small>{player.archetype || 'Player'}</small>
        </div>

        <div className="lineup-editor-list-stats">
          <span>Pts<strong>{stats.pts ?? '—'}</strong></span>
          <span>Reb<strong>{stats.reb ?? '—'}</strong></span>
          <span>Ast<strong>{stats.ast ?? '—'}</strong></span>
          <span>Ht<strong>{player.height ?? '—'}</strong></span>
          <span>Wt<strong>{player.weight ?? '—'}</strong></span>
          <span>Exp<strong>{getExperience(player)}</strong></span>
        </div>
      </div>

      <button
        type="button"
        className="lineup-editor-list-remove"
        aria-label={`Remove ${player.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onRemove(slot)
        }}
      >
        ×
      </button>
    </article>
  )
}

export default function Court({
  starters,
  statMode,
  onDropPlayer,
  onRemove,
  onOpenPicker,
  onSelectPlayer,
  onClear,
}) {
  const [viewMode, setViewMode] = useState(getInitialViewMode)
  const positions = DEFAULT_POSITIONS

  const handleBackgroundDrop = (event) => {
    event.preventDefault()
    const playerId = getDraggedPlayerId(event)
    if (playerId) onDropPlayer(playerId)
  }

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
              aria-pressed={viewMode === 'court'}
              onClick={() => setViewMode('court')}
            >
              Court
            </button>
            <button
              type="button"
              className={viewMode === 'card' ? 'active' : ''}
              aria-pressed={viewMode === 'card'}
              onClick={() => setViewMode('card')}
            >
              Cards
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'active' : ''}
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'court' && (
        <div
          className="mockup-court-stage formation-2-1-2"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleBackgroundDrop}
        >
          {SLOT_ORDER.map((slot) => {
            const player = starters[slot]
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
                  event.preventDefault()
                  event.stopPropagation()
                  const playerId = getDraggedPlayerId(event)
                  if (playerId) onDropPlayer(playerId, slot)
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
      )}

      {viewMode === 'card' && (
        <div
          className="shared-lineup-card-view lineup-editor-card-view"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleBackgroundDrop}
        >
          <div className="shared-lineup-card-players">
            {SLOT_ORDER.map((slot) => {
              const player = starters[slot]

              if (!player) {
                return (
                  <EmptyLineupSlot
                    key={slot}
                    slot={slot}
                    view="card"
                    onOpenPicker={onOpenPicker}
                    onDropPlayer={onDropPlayer}
                  />
                )
              }

              return (
                <article
                  className="shared-lineup-player-tile lineup-editor-player-tile"
                  key={slot}
                  draggable
                  onClick={() => onSelectPlayer(player.id)}
                  onDragStart={(event) =>
                    event.dataTransfer.setData(
                      'player-id',
                      String(player.id),
                    )
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const playerId = getDraggedPlayerId(event)
                    if (playerId) onDropPlayer(playerId, slot)
                  }}
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
                      <span>Pts<strong>{player[statMode]?.pts ?? '—'}</strong></span>
                      <span>Reb<strong>{player[statMode]?.reb ?? '—'}</strong></span>
                      <span>Ast<strong>{player[statMode]?.ast ?? '—'}</strong></span>
                    </div>

                    <div className="shared-lineup-player-stats lineup-editor-bio-stats">
                      <span>Ht<strong>{player.height ?? '—'}</strong></span>
                      <span>Wt<strong>{player.weight ?? '—'}</strong></span>
                      <span>Exp<strong>{getExperience(player)}</strong></span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div
          className="lineup-editor-list-view"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleBackgroundDrop}
        >
          {SLOT_ORDER.map((slot) => {
            const player = starters[slot]

            return player ? (
              <HorizontalLineupPlayer
                key={slot}
                player={player}
                slot={slot}
                statMode={statMode}
                onDropPlayer={onDropPlayer}
                onRemove={onRemove}
                onSelectPlayer={onSelectPlayer}
              />
            ) : (
              <EmptyLineupSlot
                key={slot}
                slot={slot}
                view="list"
                onOpenPicker={onOpenPicker}
                onDropPlayer={onDropPlayer}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
