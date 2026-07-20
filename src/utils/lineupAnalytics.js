const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value))

const round1 = (value) => Math.round(value * 10) / 10

export function getLineupTotals(players, statMode) {
  const validPlayers = players.filter(Boolean)

  return validPlayers.reduce(
    (totals, player) => {
      const stats = player?.[statMode]

      if (!stats) return totals

      totals.pts += stats.pts || 0
      totals.reb += stats.reb || 0
      totals.ast += stats.ast || 0
      totals.stocks += (stats.stl || 0) + (stats.blk || 0)
      totals.playersWithStats += 1

      return totals
    },
    {
      pts: 0,
      reb: 0,
      ast: 0,
      stocks: 0,
      playersWithStats: 0,
    },
  )
}

export function getLineupAnalytics(players, statMode) {
  const totals = getLineupTotals(players, statMode)
  const count = totals.playersWithStats || 1

  const averages = {
    pts: totals.pts / count,
    reb: totals.reb / count,
    ast: totals.ast / count,
    stocks: totals.stocks / count,
  }

  const scoring = clamp((averages.pts / 24) * 100)
  const playmaking = clamp((averages.ast / 8) * 100)
  const rebounding = clamp((averages.reb / 10) * 100)
  const disruption = clamp((averages.stocks / 3) * 100)

  const categoryScores = [scoring, playmaking, rebounding, disruption]
  const averageScore =
    categoryScores.reduce((sum, score) => sum + score, 0) /
    categoryScores.length

  const spread = Math.max(...categoryScores) - Math.min(...categoryScores)
  const balance = clamp(100 - spread)

  const overall =
    scoring * 0.32 +
    playmaking * 0.24 +
    rebounding * 0.22 +
    disruption * 0.22

  return {
    totals: {
      pts: round1(totals.pts),
      reb: round1(totals.reb),
      ast: round1(totals.ast),
      stocks: round1(totals.stocks),
    },
    scores: {
      overall: Math.round(overall),
      scoring: Math.round(scoring),
      playmaking: Math.round(playmaking),
      rebounding: Math.round(rebounding),
      disruption: Math.round(disruption),
      balance: Math.round((balance + averageScore) / 2),
    },
    playersWithStats: totals.playersWithStats,
  }
}

export function scoreGrade(score) {
  if (score >= 93) return 'A+'
  if (score >= 88) return 'A'
  if (score >= 84) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  return 'D'
}
