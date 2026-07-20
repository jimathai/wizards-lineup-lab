import { getLineupAnalytics } from '../utils/lineupAnalytics'

const rows = [
  ['scoring', 'Scoring'],
  ['playmaking', 'Playmaking'],
  ['rebounding', 'Rebounding'],
  ['disruption', 'Defensive Activity'],
  ['balance', 'Balance'],
]

export default function AnalyticsPanel({
  players,
  statMode,
  lineupName = 'Starters',
}) {
  const analytics = getLineupAnalytics(players, statMode)

  return (
    <section className="analytics-shell">
      <div className="analytics-title">
        <span>Lineup Analytics</span>
        <strong>{lineupName}</strong>
      </div>

      <div className="analytics-score-only">
        <span>Overall Score</span>
        <strong>{analytics.scores.overall}</strong>
        <small>out of 100</small>
      </div>

      <div className="analytics-bars">
        {rows.map(([key, label]) => (
          <div className="analytics-item" key={key}>
            <div className="analytics-item-head">
              <span>{label}</span>
              <b>{analytics.scores[key]}</b>
            </div>

            <div className="analytics-track">
              <div
                className="analytics-fill"
                style={{
                  width: `${analytics.scores[key]}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-stat-grid">
        <span><b>{analytics.totals.pts.toFixed(1)}</b>PTS</span>
        <span><b>{analytics.totals.reb.toFixed(1)}</b>REB</span>
        <span><b>{analytics.totals.ast.toFixed(1)}</b>AST</span>
        <span><b>{analytics.totals.stocks.toFixed(1)}</b>STOCKS</span>
      </div>
    </section>
  )
}
