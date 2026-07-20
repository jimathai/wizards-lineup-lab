import { useMemo, useState } from 'react'

const archetypes = [
  {
    key: 'scorer',
    label: 'Scorer',
    description: 'Primary offensive option.',
  },
  {
    key: 'playmaker',
    label: 'Playmaker',
    description: 'Creates shots and organizes offense.',
  },
  {
    key: 'defender',
    label: 'Defender',
    description: 'Adds steals, blocks, and disruption.',
  },
  {
    key: 'big',
    label: 'Big',
    description: 'Provides size, rebounding, and interior impact.',
  },
  {
    key: 'balanced',
    label: 'Balanced',
    description: 'Contributes across several areas.',
  },
]

function getArchetype(player, statMode) {
  const stats = player?.[statMode]

  if (!stats) return 'balanced'

  const scoring = stats.pts || 0
  const playmaking = stats.ast || 0
  const rebounding = stats.reb || 0
  const defense = (stats.stl || 0) + (stats.blk || 0)
  const isBig =
    player.pos?.includes('C') ||
    rebounding >= 8

  if (isBig && rebounding >= 8) return 'big'
  if (playmaking >= 6) return 'playmaker'
  if (defense >= 2) return 'defender'
  if (scoring >= 18) return 'scorer'

  return 'balanced'
}

export default function ArchetypeLegend({
  players,
  statMode,
}) {
  const [active, setActive] = useState(null)

  const counts = useMemo(() => {
    const totals = {
      scorer: 0,
      playmaker: 0,
      defender: 0,
      big: 0,
      balanced: 0,
    }

    players.forEach((player) => {
      totals[getArchetype(player, statMode)] += 1
    })

    return totals
  }, [players, statMode])

  return (
    <section className="archetype-legend-panel">
      <div className="archetype-legend-head">
        <div>
          <span className="section-kicker">
            Player Types
          </span>
        </div>

        {active && (
          <button
            className="legend-clear"
            onClick={() => setActive(null)}
          >
            Clear
          </button>
        )}
      </div>

      <div className="archetype-legend-list">
        {archetypes.map((item) => {
          const isActive = active === item.key

          return (
            <button
              key={item.key}
              className={`archetype-legend-item archetype-${item.key} ${
                isActive ? 'active' : ''
              }`}
              onClick={() =>
                setActive(
                  isActive ? null : item.key,
                )
              }
            >
              <span className="legend-swatch" />

              <span className="legend-copy">
                <strong>{item.label}</strong>
                <small>
                  {isActive
                    ? item.description
                    : `${counts[item.key]} in starters`}
                </small>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
