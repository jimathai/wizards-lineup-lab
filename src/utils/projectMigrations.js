import playersData from '../data/players.json'
import {
  CURRENT_PROJECT_VERSION,
  createDefaultLineups,
  DEFAULT_LINEUP_NAMES,
  createEmptyStarters,
  initialProjectState,
} from '../data/initialProjectState'

const clone = (value) => structuredClone(value)
const defaultPlayerIds = () => playersData.map((player) => player.id)

const normalizeDepthUnit = (unit) =>
  Array.from({ length: 5 }, (_, index) => unit?.[index] ?? null)

const normalizeStarters = (starters) => ({
  ...createEmptyStarters(),
  ...(starters || {}),
})

const legacyDefaultNames = Array.from(
  { length: 6 },
  (_, index) => `Lineup ${index + 1}`,
)

const normalizeSavedLineups = (savedLineups, lineup) => {
  const defaults = createDefaultLineups()

  return defaults.map((defaultLineup, index) => {
    const savedLineup = savedLineups?.[index]
    const savedName = savedLineup?.name?.trim()
    const shouldUseNewDefaultName =
      !savedName || legacyDefaultNames[index] === savedName

    let playerIds = Array.isArray(savedLineup?.playerIds)
      ? savedLineup.playerIds.filter(Boolean)
      : []

    if (playerIds.length === 0 && index === 1) {
      playerIds = normalizeDepthUnit(lineup?.secondUnit).filter(Boolean)
    }

    if (playerIds.length === 0 && index === 2) {
      playerIds = normalizeDepthUnit(lineup?.thirdUnit).filter(Boolean)
    }

    return {
      name: shouldUseNewDefaultName
        ? DEFAULT_LINEUP_NAMES[index]
        : savedName,
      playerIds,
    }
  })
}

const normalizeTeam = (team, fallbackTeam) => ({
  ...clone(fallbackTeam),
  ...(team || {}),
  players:
    Array.isArray(team?.players) && team.players.length > 0
      ? team.players
      : defaultPlayerIds(),
  lineup: {
    starters: normalizeStarters(team?.lineup?.starters),
    secondUnit: normalizeDepthUnit(team?.lineup?.secondUnit),
    thirdUnit: normalizeDepthUnit(team?.lineup?.thirdUnit),
  },
  savedLineups: normalizeSavedLineups(
    team?.savedLineups,
    team?.lineup,
  ),
})

const createFreshProject = () => ({
  ...clone(initialProjectState),
  teams: Object.fromEntries(
    Object.entries(initialProjectState.teams).map(([teamId, team]) => [
      teamId,
      normalizeTeam(team, team),
    ]),
  ),
})

const migrateLegacySingleTeamProject = (savedProject) => {
  const freshProject = createFreshProject()

  return {
    ...freshProject,
    statMode: savedProject.statMode || freshProject.statMode,
    formation: savedProject.formation || freshProject.formation,
    selectedPlayerId: savedProject.selectedPlayerId || null,
    analyticsTarget: savedProject.analyticsTarget || {
      type: 'starters',
      index: null,
    },
    teams: {
      wizards: normalizeTeam(
        {
          ...freshProject.teams.wizards,
          lineup: {
            starters: savedProject.starters,
            secondUnit: savedProject.second,
            thirdUnit: savedProject.third,
          },
          savedLineups: savedProject.savedLineups,
        },
        freshProject.teams.wizards,
      ),
    },
  }
}

const migrateNormalizedProject = (savedProject) => {
  const freshProject = createFreshProject()
  const activeTeamId =
    savedProject.activeTeamId && savedProject.teams?.[savedProject.activeTeamId]
      ? savedProject.activeTeamId
      : 'wizards'

  const teamEntries = Object.entries(savedProject.teams || {})
  const normalizedTeams = Object.fromEntries(
    teamEntries.map(([teamId, team]) => [
      teamId,
      normalizeTeam(
        team,
        freshProject.teams[teamId] || {
          ...freshProject.teams.wizards,
          id: teamId,
          name: team?.name || teamId,
          abbreviation: team?.abbreviation || '',
          city: team?.city || '',
          imgURL: team?.imgURL || '',
        },
      ),
    ]),
  )

  Object.entries(freshProject.teams).forEach(([teamId, team]) => {
    if (!normalizedTeams[teamId]) normalizedTeams[teamId] = team
  })

  return {
    ...freshProject,
    ...savedProject,
    activeTeamId,
    teams: normalizedTeams,
  }
}

export const migrateProject = (savedProject) => {
  if (!savedProject || typeof savedProject !== 'object') {
    return createFreshProject()
  }

  const migratedProject = savedProject.teams
    ? migrateNormalizedProject(savedProject)
    : migrateLegacySingleTeamProject(savedProject)

  return {
    ...migratedProject,
    version: CURRENT_PROJECT_VERSION,
  }
}
