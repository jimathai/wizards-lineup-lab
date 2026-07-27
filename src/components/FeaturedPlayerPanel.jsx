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

const displayInteger = (value, suffix = '') => {
  if (value === undefined || value === null || value === '') return '—'

  const number = Number(value)
  return Number.isFinite(number)
    ? `${Math.trunc(number)}${suffix}`
    : `${value}${suffix}`
}

const displayMeasurement = (value, suffix = '') => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'number') return `${Math.trunc(value)}${suffix}`

  const text = String(value).trim()
  const numericMeasurement = text.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/)

  if (!numericMeasurement || text.includes("'")) {
    return `${text}${suffix}`
  }

  const [, sign, number, existingSuffix] = numericMeasurement
  return `${sign}${Math.trunc(Number(number))}${existingSuffix}${suffix}`
}

const displayPick = (player) => {
  if (player.draftPick === undefined || player.draftPick === null || player.draftPick === '') {
    return player.draftYear ? 'U' : '—'
  }
  return `#${player.draftPick}`
}

function StatGroup({ title, items, className = '' }) {
  return (
    <section className={`featured-stat-section ${className}`.trim()}>
      <h3>{title}</h3>
      <div
        className={`featured-stat-grid featured-stat-grid-${items.length}`}
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
    { label: 'TOV', value: displayValue(stats.tov) },
    { label: '+/-', value: displayValue(stats.plusMinus) },
  ]

  const efficiency = [
    { label: 'FG', value: displayInteger(stats.fgPct, '%') },
    { label: '3P', value: displayInteger(stats.threePct, '%') },
    { label: 'FT', value: displayInteger(stats.ftPct, '%') },
    { label: 'TS', value: displayInteger(stats.trueShootingPct, '%') },
  ]

  const bio = [
    { label: 'Age', value: displayValue(player.age) },
    { label: 'Exp', value: displayValue(player.experience) },
    {
      label: 'From',
      value: displayValue(player.college || player.country),
    },
  ]

  const draft = [
    { label: 'Year', value: displayValue(player.draftYear) },
    { label: 'Pick', value: displayPick(player) },
    { label: 'Shoots', value: displayValue(player.shootingHand) },
  ]

  const measurements = [
    { label: 'Height', value: displayMeasurement(player.height) },
    { label: 'Weight', value: displayMeasurement(player.weight, ' lbs') },
    { label: 'Vertical', value: displayMeasurement(player.vertical) },
    { label: 'Wingspan', value: displayMeasurement(player.wingspan) },
    {
      label: 'Standing Reach',
      value: displayMeasurement(player.standingReach),
    },
    { label: 'Ape Index', value: displayMeasurement(player.apeIndex) },
  ]

  return (
    <aside className="featured-player-panel featured-player-panel-expanded">
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
        <StatGroup title="Bio" items={bio} />
        <StatGroup title="Draft Profile" items={draft} />
        <StatGroup title="Measurements" items={measurements} />
      </div>
    </aside>
  )
}
