import { useEffect, useMemo, useState } from 'react'
import AnalyticsPanel from './AnalyticsPanel'
import PlayerCard from './PlayerCard'
import { getPublicSharedLineup } from '../services/sharedLineupService'

const FORMATIONS = {
  '2-1-2': {
    PG: { x: 30, y: 17 }, SG: { x: 70, y: 17 },
    SF: { x: 50, y: 49 }, PF: { x: 27, y: 80 }, C: { x: 73, y: 80 },
  },
  '2-2-1': {
    PG: { x: 30, y: 17 }, SG: { x: 70, y: 17 },
    SF: { x: 25, y: 49 }, PF: { x: 75, y: 49 }, C: { x: 50, y: 80 },
  },
  '1-2-2': {
    PG: { x: 50, y: 15 }, SG: { x: 23, y: 47 },
    SF: { x: 77, y: 47 }, PF: { x: 28, y: 80 }, C: { x: 72, y: 80 },
  },
  '1-3-1': {
    PG: { x: 50, y: 13 }, SG: { x: 15, y: 49 },
    SF: { x: 50, y: 49 }, PF: { x: 85, y: 49 }, C: { x: 50, y: 84 },
  },
}

export default function SharedLineupPage({ lineupId }) {
  const [lineup, setLineup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statMode, setStatMode] = useState('current')
  const [viewMode, setViewMode] = useState('card')

  useEffect(() => {
    let cancelled = false

    getPublicSharedLineup(lineupId)
      .then((result) => {
        if (!cancelled) setLineup(result)
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lineupId])

  const theme = useMemo(() => ({
    '--team-primary': lineup?.team?.primary_color || '#002B5C',
    '--team-secondary': lineup?.team?.secondary_color || '#E31837',
    '--team-accent': lineup?.team?.accent_color || '#FFFFFF',
    '--team-surface': '#0b1728',
    '--team-glow': lineup?.team?.secondary_color || '#E31837',
  }), [lineup])

  if (loading) {
    return <main className="shared-lineup-status">Loading lineup…</main>
  }

  if (error || !lineup) {
    return (
      <main className="shared-lineup-status">
        <h1>Lineup unavailable</h1>
        <p>This lineup is private, missing, or the link is incorrect.</p>
        <a href="/">Open District Basketball Lab</a>
      </main>
    )
  }

  const formation = FORMATIONS[lineup.formation]
    ? lineup.formation
    : '2-1-2'
  const positions = FORMATIONS[formation]

  return (
    <div className="app-frame shared-lineup-page" style={theme}>
      <main className="shared-lineup-presentation">
        <section className="shared-lineup-main-panel">
          <div className="shared-lineup-floating-bar">
            <h1>{lineup.name}</h1>


          </div>

          {viewMode === 'court' ? (
            <div
              className={`mockup-court-stage formation-${formation} shared-court-stage`}
            >
              {Object.entries(positions).map(([slot, position]) => {
                const player = lineup.playersBySlot[slot]

                return (
                  <div
                    key={slot}
                    className="mockup-court-slot"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                  >
                    {player ? (
                      <PlayerCard
                        player={player}
                        statMode={statMode}
                        draggable={false}
                      />
                    ) : (
                      <div className="shared-empty-slot">{slot}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="shared-lineup-card-view">
              <div className="shared-lineup-card-score">
                <span>Lineup</span>
                <strong>{lineup.name}</strong>
              </div>

              <div className="shared-lineup-card-players">
                {lineup.players.map((player) => (
                  <article
                    className="shared-lineup-player-tile"
                    key={player.id}
                  >
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
                        <span>
                          {player.pos || player.position || '—'}
                        </span>
                      </div>

                      <small>{player.archetype || 'Player'}</small>

                      <div className="shared-lineup-player-stats">
                        <span>
                          Pts
                          <strong>
                            {player[statMode]?.pts ?? '—'}
                          </strong>
                        </span>
                        <span>
                          Reb
                          <strong>
                            {player[statMode]?.reb ?? '—'}
                          </strong>
                        </span>
                        <span>
                          Ast
                          <strong>
                            {player[statMode]?.ast ?? '—'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="shared-lineup-analytics-column">
          <div className="shared-lineup-analytics-toolbar">
            <div
              className="shared-view-toggle"
              role="group"
              aria-label="Lineup display"
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

            <label className="shared-stat-control">
              Stats
              <select
                value={statMode}
                onChange={(event) => setStatMode(event.target.value)}
              >
                <option value="current">2025–26</option>
                <option value="career">Career</option>
              </select>
            </label>

            <a className="shared-builder-link" href="/">
              Build a Lineup
            </a>
          </div>

          <AnalyticsPanel
            players={lineup.players}
            statMode={statMode}
            lineupName={lineup.name}
          />
        </aside>
      </main>
    </div>
  )
}
