import { useEffect, useMemo, useRef, useState } from 'react'
import { getPublicSharedLineups } from '../services/sharedLineupService'
import { downloadLineupImage } from '../utils/shareLineupImage'

function SharedLineupCard({ lineup, statMode }) {
  const captureRef = useRef(null)
  const [creatingImage, setCreatingImage] = useState(false)

  const handleDownloadImage = async () => {
    try {
      setCreatingImage(true)
      await downloadLineupImage({
        node: captureRef.current,
        lineupName: lineup.name,
      })
    } catch (imageError) {
      window.alert(
        imageError?.message || 'Unable to create the lineup image.',
      )
    } finally {
      setCreatingImage(false)
    }
  }

  return (
    <section className="shared-collection-lineup" ref={captureRef}>
      <div className="shared-collection-lineup-heading">
        <span>Lineup {lineup.slotIndex + 1}</span>
        <h2>{lineup.name}</h2>
        <button
          type="button"
          className="shared-builder-link lineup-image-export-control"
          onClick={handleDownloadImage}
          disabled={creatingImage}
        >
          {creatingImage ? 'Creating Image…' : 'Download Image'}
        </button>
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
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function SharedLineupsPage({ ownerId, teamId }) {
  const [lineups, setLineups] = useState([])
  const [statMode, setStatMode] = useState('current')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getPublicSharedLineups({ ownerId, teamId })
      .then((result) => {
        if (!cancelled) setLineups(result)
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
  }, [ownerId, teamId])

  const team = lineups[0]?.team

  const theme = useMemo(
    () => ({
      '--team-primary': team?.primary_color || '#002B5C',
      '--team-secondary': team?.secondary_color || '#E31837',
      '--team-accent': team?.accent_color || '#FFFFFF',
      '--team-surface': '#0b1728',
      '--team-glow': team?.secondary_color || '#E31837',
    }),
    [team],
  )

  if (loading) {
    return <main className="shared-lineup-status">Loading lineups…</main>
  }

  if (error || !lineups.length) {
    return (
      <main className="shared-lineup-status">
        <h1>No public lineups available</h1>
        <p>
          This collection has no public five-player lineups, or the
          link is incorrect.
        </p>
        <a href="/">Open District Basketball Lab</a>
      </main>
    )
  }

  return (
    <div className="app-frame shared-lineups-collection-page" style={theme}>
      <header className="shared-collection-toolbar">
        <div>
          <span className="section-kicker">
            {team?.city} {team?.name}
          </span>
          <h1>Shared Lineups</h1>
          <p
            style={{
              margin: '5px 0 0',
              maxWidth: '720px',
              color: 'rgba(255, 255, 255, 0.72)',
              fontSize: 'clamp(12px, 0.9vw, 15px)',
              lineHeight: 1.4,
            }}
          >
            Download a lineup image, paste the copied share link into your
            post, or use both.
          </p>
        </div>

        <div className="shared-collection-actions">
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
      </header>

      <main className="shared-lineups-stack">
        {lineups.map((lineup) => (
          <SharedLineupCard
            key={lineup.id}
            lineup={lineup}
            statMode={statMode}
          />
        ))}
      </main>
    </div>
  )
}
