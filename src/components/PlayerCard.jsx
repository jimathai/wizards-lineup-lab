import { useMemo } from 'react'

const fallback = (name) =>
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="210">
      <rect width="100%" height="100%" fill="#17263c"/>
      <text x="50%" y="58%" text-anchor="middle"
        fill="white" font-family="Arial"
        font-size="46" font-weight="700">
        ${name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}
      </text>
    </svg>
  `)}`

const positionNames = {
  G: 'GUARD',
  F: 'FORWARD',
  C: 'CENTER',
  'G/F': 'GUARD / FORWARD',
  'F/G': 'FORWARD / GUARD',
  'F/C': 'FORWARD / CENTER',
  'C/F': 'CENTER / FORWARD',
  PG: 'POINT GUARD',
  SG: 'SHOOTING GUARD',
  SF: 'SMALL FORWARD',
  PF: 'POWER FORWARD',
}

function getPositionLabel(position) {
  return positionNames[position] || position || 'PLAYER'
}

function getArchetype(stats, position) {
  if (!stats) return 'balanced'

  const scoring = stats.pts || 0
  const playmaking = stats.ast || 0
  const rebounding = stats.reb || 0
  const defense = (stats.stl || 0) + (stats.blk || 0)
  const isBig = position?.includes('C') || rebounding >= 8

  if (isBig && rebounding >= 8) return 'big'
  if (playmaking >= 6) return 'playmaker'
  if (defense >= 2) return 'defender'
  if (scoring >= 18) return 'scorer'

  return 'balanced'
}

export default function PlayerCard({
  player,
  statMode,
  compact = false,
  onRemove,
  onSelect,
  draggable = true,
}) {
  const stats = player[statMode]
  const stocks = stats
    ? (stats.stl || 0) + (stats.blk || 0)
    : 0

  const archetype = useMemo(
    () => getArchetype(stats, player.pos),
    [stats, player.pos],
  )

  const selectPlayer = () => {
    if (onSelect) onSelect(player.id)
  }

  if (compact) {
    return (
      <article
        className={`roster-row-card selectable-player-card archetype-${archetype}`}
        draggable={draggable}
        onClick={selectPlayer}
        onDragStart={(event) =>
          event.dataTransfer.setData(
            'player-id',
            String(player.id),
          )
        }
      >
        <img
          src={player.image}
          alt={player.name}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = fallback(player.name)
          }}
        />

        <div className="roster-row-text">
          <strong>
            {player.number ? `${player.number} ` : ''}
            {player.name}
          </strong>

          <span>{getPositionLabel(player.pos)}</span>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`court-player-card selectable-player-card archetype-${archetype}`}
      draggable={draggable}
      onClick={selectPlayer}
      onDragStart={(event) =>
        event.dataTransfer.setData(
          'player-id',
          String(player.id),
        )
      }
    >
      <div className="player-position-banner">
        {getPositionLabel(player.pos)}
      </div>

      <div className="player-photo-wrap">
        <div className="player-number-badge">
          {player.number || '—'}
        </div>

        {onRemove && (
          <button
            className="player-close"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
            aria-label={`Remove ${player.name}`}
          >
            ×
          </button>
        )}

        <img
          src={player.image}
          alt={player.name}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = fallback(player.name)
          }}
        />
      </div>

      <div className="court-player-name">
        {player.name}
      </div>

      {stats && (
        <div className="court-player-stats">
          <span><b>{stats.pts?.toFixed(1) ?? '—'}</b>PTS</span>
          <span><b>{stats.reb?.toFixed(1) ?? '—'}</b>REB</span>
          <span><b>{stats.ast?.toFixed(1) ?? '—'}</b>AST</span>
          <span><b>{stocks.toFixed(1)}</b>STK</span>
        </div>
      )}
    </article>
  )
}
