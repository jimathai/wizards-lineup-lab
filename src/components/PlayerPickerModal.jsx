import { useMemo, useState } from 'react'

const fallback = (name) =>
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="100">
      <rect width="100%" height="100%" fill="#17263c"/>
      <text x="50%" y="60%" text-anchor="middle"
        fill="white" font-family="Arial"
        font-size="34" font-weight="700">
        ${name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}
      </text>
    </svg>
  `)}`

function getArchetype(player, statMode) {
  const stats = player?.[statMode]

  if (!stats) return 'balanced'

  const scoring = stats.pts || 0
  const playmaking = stats.ast || 0
  const rebounding = stats.reb || 0
  const defense = (stats.stl || 0) + (stats.blk || 0)
  const isBig = player.pos?.includes('C') || rebounding >= 8

  if (isBig && rebounding >= 8) return 'big'
  if (playmaking >= 6) return 'playmaker'
  if (defense >= 2) return 'defender'
  if (scoring >= 18) return 'scorer'

  return 'balanced'
}

export default function PlayerPickerModal({
  open,
  players,
  anchor,
  statMode,
  onSelect,
  onClose,
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return players
    return players.filter((player) =>
      `${player.name} ${player.pos}`.toLowerCase().includes(q),
    )
  }, [players, search])

  if (!open || !anchor) return null

  const width = 380
  const height = 470
  const padding = 12
  let left = anchor.left
  let top = anchor.bottom + 8

  if (left + width > window.innerWidth - padding) {
    left = window.innerWidth - width - padding
  }

  if (top + height > window.innerHeight - padding) {
    top = Math.max(padding, anchor.top - height - 8)
  }

  return (
    <>
      <button className="picker-dismiss" onClick={onClose} />
      <section className="picker-modern" style={{ left, top }}>
        <div className="picker-modern-head">
          <h2>Select Player</h2>
          <button onClick={onClose}>×</button>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search..."
          autoFocus
        />

        <div className="picker-modern-list">
          {filtered.map((player) => {
            const archetype = getArchetype(player, statMode)

            return (
              <button
                key={player.id}
                className={`picker-modern-row archetype-${archetype}`}
                onClick={() => onSelect(player.id)}
              >
                <span className="picker-modern-photo">
                  <img
                    src={player.image}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = fallback(player.name)
                    }}
                  />
                </span>

                <strong className="picker-modern-number">
                  {player.number || '—'}
                </strong>

                <strong className="picker-modern-name">
                  {player.name}
                </strong>

                <span className="picker-modern-position">
                  {player.pos}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
