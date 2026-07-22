import playersData from '../../data/players.json'

const clonePlayers = (players) =>
  players.map((player) => ({
    ...player,
    current: player.current ? { ...player.current } : null,
    career: player.career ? { ...player.career } : null,
  }))

export const localPlayerProvider = {
  async getPlayers() {
    return clonePlayers(playersData)
  },

  async getPlayerById(playerId) {
    const player = playersData.find(
      (candidate) => String(candidate.id) === String(playerId),
    )

    return player ? clonePlayers([player])[0] : null
  },

  async getTeamRoster(team) {
    if (!team) return []

    const configuredPlayerIds = Array.isArray(team.players)
      ? team.players
      : []

    if (configuredPlayerIds.length > 0) {
      const playerIds = new Set(configuredPlayerIds.map(String))

      return clonePlayers(
        playersData.filter((player) => playerIds.has(String(player.id))),
      )
    }

    const teamNames = [
      team.name,
      team.city && team.name ? `${team.city} ${team.name}` : null,
    ]
      .filter(Boolean)
      .map((name) => name.toLowerCase())

    const matchingPlayers = playersData.filter((player) => {
      const playerTeam = String(player.team || '').toLowerCase()
      return teamNames.some(
        (teamName) =>
          playerTeam === teamName || playerTeam.endsWith(` ${teamName}`),
      )
    })

    if (matchingPlayers.length > 0) {
      return clonePlayers(matchingPlayers)
    }

    // The bundled fallback contains only Washington players.
    // Never show them under another team's selector.
    return team.id === 'wizards' ? clonePlayers(playersData) : []
  },
}
