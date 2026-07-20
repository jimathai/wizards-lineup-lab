const POSITION_NAMES = {
  G: 'Guard',
  F: 'Forward',
  C: 'Center',
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  'G/F': 'Guard / Forward',
  'F/G': 'Forward / Guard',
  'F/C': 'Forward / Center',
  'C/F': 'Center / Forward',
}

const displayValue = (value, suffix = '') =>
  value === undefined || value === null || value === ''
    ? '—'
    : `${value}${suffix}`

function StatGroup({ title, items }) {
  return (
    <section className="featured-stat-section">
      <h3>{title}</h3>

      <div
        className={`featured-stat-grid ${
          items.length === 6 ? 'featured-stat-grid-six' : ''
        }`}
      >
        {items.map((item) => (
          <div className="featured-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function FeaturedPlayerPanel({
  player,
  statMode = 'current',
}) {
  if (!player) {
    return (
      <aside className="featured-player-panel featured-player-empty">
        <h2>Select a player</h2>
        <p>Choose a player from the court or player pool.</p>
      </aside>
    )
  }

  const stats = player[statMode] || {}
  const position = POSITION_NAMES[player.pos] || player.pos || 'Player'

  const production = [
    { label: 'Pts', value: displayValue(stats.pts) },
    { label: 'Reb', value: displayValue(stats.reb) },
    { label: 'Ast', value: displayValue(stats.ast) },
    { label: 'Stl', value: displayValue(stats.stl) },
    { label: 'Blk', value: displayValue(stats.blk) },
    { label: '3PT', value: displayValue(stats.threePm) },
  ]

  const efficiency = [
    { label: 'FG%', value: displayValue(stats.fgPct) },
    { label: '3P%', value: displayValue(stats.threePct) },
    { label: 'FT%', value: displayValue(stats.ftPct) },
  ]

  const measurements = [
    { label: 'Height', value: displayValue(player.height) },
    { label: 'Weight', value: displayValue(player.weight) },
    { label: 'Vertical', value: displayValue(player.vertical) },
    { label: 'Wingspan', value: displayValue(player.wingspan) },
    {
      label: 'Standing Reach',
      value: displayValue(player.standingReach),
    },
    { label: 'Ape Index', value: displayValue(player.apeIndex) },
  ]

  return (
    <aside className="featured-player-panel">
      <div className="featured-player-identity">
        <h2>{player.name}</h2>
        <p>
          #{player.number || '—'} {position}
        </p>
      </div>

      <div className="featured-player-image">
        {player.image ? (
          <img src={player.image} alt={player.name} />
        ) : (
          <div className="featured-player-image-fallback">
            {player.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </div>
        )}
      </div>

      <div className="featured-player-stat-sections">
        <StatGroup title="Production" items={production} />
        <StatGroup title="Efficiency" items={efficiency} />
        <StatGroup title="Measurements" items={measurements} />
      </div>
    </aside>
  )
}
