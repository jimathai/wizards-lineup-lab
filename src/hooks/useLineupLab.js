import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTeamRoster } from '../services/playerDataService'
import { migrateProject } from '../utils/projectMigrations'
import {
  createShareUrl,
  loadProject,
  saveProjectToStorage,
} from '../utils/projectStorage'

const createInitialProject = () => migrateProject(loadProject())

export default function useLineupLab() {
  const [project, setProject] = useState(createInitialProject)
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [playerDataLoading, setPlayerDataLoading] = useState(true)
  const [playerDataError, setPlayerDataError] = useState(null)
  const [pickerTarget, setPickerTarget] = useState(null)
  const [pickerAnchor, setPickerAnchor] = useState(null)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [sort, setSort] = useState('name')

  const activeTeam = project.teams[project.activeTeamId]
  const availableTeams = Object.values(project.teams)
  const rosterTeam = useMemo(
    () => ({
      id: activeTeam.id,
      name: activeTeam.name,
      abbreviation: activeTeam.abbreviation,
      city: activeTeam.city,
      players: activeTeam.players,
    }),
    [
      activeTeam.abbreviation,
      activeTeam.city,
      activeTeam.id,
      activeTeam.name,
      activeTeam.players,
    ],
  )
  const starters = activeTeam.lineup.starters
  const savedLineups = activeTeam.savedLineups
  const statMode = project.statMode
  const formation = project.formation
  const selectedPlayerId = project.selectedPlayerId
  const analyticsTarget = project.analyticsTarget

  useEffect(() => {
    let cancelled = false

    const loadRoster = async () => {
      setPlayerDataLoading(true)
      setPlayerDataError(null)

      try {
        const players = await getTeamRoster(rosterTeam)

        if (!cancelled) {
          setRosterPlayers(players)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load player data:', error)
          setRosterPlayers([])
          setPlayerDataError(
            error instanceof Error
              ? error.message
              : 'Unable to load roster.',
          )
        }
      } finally {
        if (!cancelled) {
          setPlayerDataLoading(false)
        }
      }
    }

    loadRoster()

    return () => {
      cancelled = true
    }
  }, [rosterTeam])

  const playersById = useMemo(
    () =>
      new Map(
        rosterPlayers.map((player) => [String(player.id), player]),
      ),
    [rosterPlayers],
  )

  const findPlayer = useCallback(
    (id) =>
      id == null ? null : playersById.get(String(id)) || null,
    [playersById],
  )

  const updateProjectField = (field, value) => {
    setProject((current) => ({
      ...current,
      [field]:
        typeof value === 'function' ? value(current[field]) : value,
    }))
  }

  const updateActiveTeam = (updater) => {
    setProject((current) => {
      const currentTeam = current.teams[current.activeTeamId]
      const updatedTeam =
        typeof updater === 'function' ? updater(currentTeam) : updater

      return {
        ...current,
        teams: {
          ...current.teams,
          [current.activeTeamId]: updatedTeam,
        },
      }
    })
  }

  const updateActiveLineup = (updater) => {
    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      lineup:
        typeof updater === 'function'
          ? updater(currentTeam.lineup)
          : updater,
    }))
  }

  const setActiveTeamId = (teamId) => {
    if (!project.teams[teamId] || teamId === project.activeTeamId) return

    setProject((current) => ({
      ...current,
      activeTeamId: teamId,
      selectedPlayerId: null,
      analyticsTarget: { type: 'starters', index: null },
    }))
    closePlayerPicker()
    setSearch('')
    setPosition('')
  }

  const setStatMode = (value) => updateProjectField('statMode', value)
  const setFormation = (value) => updateProjectField('formation', value)
  const setSelectedPlayerId = (value) =>
    updateProjectField('selectedPlayerId', value)
  const setAnalyticsTarget = (value) =>
    updateProjectField('analyticsTarget', value)

  const assignedIds = useMemo(
    () => Object.values(starters).filter(Boolean),
    [starters],
  )

  const availablePlayers = useMemo(
    () =>
      rosterPlayers.filter(
        (player) => !assignedIds.includes(player.id),
      ),
    [assignedIds, rosterPlayers],
  )

  const filteredPlayerPool = useMemo(() => {
    const query = search.trim().toLowerCase()

    return availablePlayers
      .filter((player) =>
        player.name.toLowerCase().includes(query),
      )
      .filter(
        (player) => !position || player.pos.includes(position),
      )
      .sort((playerA, playerB) => {
        if (sort === 'pts') {
          return (
            (playerB[statMode]?.pts ?? -1) -
            (playerA[statMode]?.pts ?? -1)
          )
        }

        return playerA.name.localeCompare(playerB.name)
      })
  }, [availablePlayers, position, search, sort, statMode])

  const startingIds = useMemo(
    () => Object.values(starters).filter(Boolean),
    [starters],
  )

  const startingPlayers = useMemo(
    () => startingIds.map(findPlayer).filter(Boolean),
    [findPlayer, startingIds],
  )

  const starterPlayersBySlot = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(starters).map(([slot, playerId]) => [
          slot,
          findPlayer(playerId),
        ]),
      ),
    [findPlayer, starters],
  )

  const hydratedLineups = useMemo(
    () =>
      savedLineups.map((lineup) => ({
        name: lineup.name,
        players: lineup.playerIds.map(findPlayer).filter(Boolean),
      })),
    [findPlayer, savedLineups],
  )

  const selectedPlayer = useMemo(
    () =>
      findPlayer(selectedPlayerId) ||
      startingPlayers[0] ||
      rosterPlayers[0] ||
      null,
    [findPlayer, rosterPlayers, selectedPlayerId, startingPlayers],
  )

  const analyzedLineup = useMemo(
    () =>
      analyticsTarget.type === 'saved'
        ? hydratedLineups[analyticsTarget.index] || {
            name: 'Lineup',
            players: [],
          }
        : {
            name: 'Starters',
            players: startingPlayers,
          },
    [analyticsTarget, hydratedLineups, startingPlayers],
  )

  const findPlayerLocation = (playerId) => {
    const starterSlot = Object.entries(starters).find(
      ([, value]) => value === playerId,
    )

    return starterSlot
      ? { unit: 'starters', key: starterSlot[0] }
      : null
  }

  const getLocationValue = (location, lineup) => {
    if (!location) return null
    return lineup[location.unit][location.key]
  }

  const setLocationValue = (location, value, lineup) => {
    lineup[location.unit][location.key] = value
  }

  const moveOrSwapPlayer = (playerId, targetLocation) => {
    const sourceLocation = findPlayerLocation(playerId)

    if (
      sourceLocation?.unit === targetLocation.unit &&
      sourceLocation.key === targetLocation.key
    ) {
      return
    }

    updateActiveLineup((currentLineup) => {
      const nextLineup = {
        starters: { ...currentLineup.starters },
        secondUnit: [...currentLineup.secondUnit],
        thirdUnit: [...currentLineup.thirdUnit],
      }
      const targetPlayerId = getLocationValue(
        targetLocation,
        nextLineup,
      )

      setLocationValue(targetLocation, playerId, nextLineup)

      if (sourceLocation) {
        setLocationValue(
          sourceLocation,
          targetPlayerId || null,
          nextLineup,
        )
      }

      return nextLineup
    })

    setSelectedPlayerId(playerId)
  }

  const placeStarter = (playerId, preferredSlot = null) => {
    const targetSlot =
      preferredSlot ||
      Object.keys(starters).find((slot) => !starters[slot])

    if (!targetSlot) return

    moveOrSwapPlayer(playerId, {
      unit: 'starters',
      key: targetSlot,
    })
    setAnalyticsTarget({ type: 'starters', index: null })
  }

  const removeStarter = (slot) => {
    updateActiveLineup((currentLineup) => ({
      ...currentLineup,
      starters: {
        ...currentLineup.starters,
        [slot]: null,
      },
    }))
  }

  const useSavedLineupAsStarters = (lineupIndex) => {
    const savedLineup = savedLineups[lineupIndex]
    if (!savedLineup?.playerIds?.length) return

    const shouldReplace =
      startingIds.length === 0 ||
      window.confirm(
        `Replace the current starters with ${savedLineup.name}?`,
      )

    if (!shouldReplace) return

    const nextStarterIds = Array.from(
      new Set(savedLineup.playerIds.filter(Boolean)),
    ).slice(0, 5)

    updateActiveLineup((currentLineup) => {
      const starterSlots = Object.keys(currentLineup.starters)
      const promotedIds = new Set(nextStarterIds)

      return {
        ...currentLineup,
        starters: Object.fromEntries(
          starterSlots.map((slot, index) => [
            slot,
            nextStarterIds[index] || null,
          ]),
        ),
        secondUnit: currentLineup.secondUnit.map((playerId) =>
          promotedIds.has(playerId) ? null : playerId,
        ),
        thirdUnit: currentLineup.thirdUnit.map((playerId) =>
          promotedIds.has(playerId) ? null : playerId,
        ),
      }
    })

    setSelectedPlayerId(nextStarterIds[0] || null)
    setAnalyticsTarget({ type: 'starters', index: null })
  }

  const openPlayerPicker = (target, rect) => {
    setPickerTarget(target)
    setPickerAnchor({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    })
  }

  const closePlayerPicker = () => {
    setPickerTarget(null)
    setPickerAnchor(null)
  }

  const choosePlayer = (playerId) => {
    if (!pickerTarget) return

    if (pickerTarget.type === 'starter') {
      placeStarter(playerId, pickerTarget.slot)
    }

    closePlayerPicker()
  }

  const saveCurrentLineup = (lineupIndex) => {
    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map(
        (lineup, index) =>
          index === lineupIndex
            ? { ...lineup, playerIds: startingIds }
            : lineup,
      ),
    }))

    setAnalyticsTarget({ type: 'saved', index: lineupIndex })
  }

  const renameLineup = (lineupIndex, name) => {
    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map(
        (lineup, index) =>
          index === lineupIndex ? { ...lineup, name } : lineup,
      ),
    }))
  }

  const saveProject = () => {
    saveProjectToStorage(project)
  }

  const copyShareLink = async () => {
    const url = createShareUrl(project)

    try {
      await navigator.clipboard.writeText(url)
      window.alert('Share link copied.')
    } catch {
      window.prompt('Copy this share link:', url)
    }
  }

  return {
    activeTeam,
    analyticsTarget,
    analyzedLineup,
    availablePlayers,
    availableTeams,
    choosePlayer,
    closePlayerPicker,
    copyShareLink,
    filteredPlayerPool,
    formation,
    hydratedLineups,
    openPlayerPicker,
    pickerAnchor,
    pickerTarget,
    playerDataError,
    playerDataLoading,
    placeStarter,
    position,
    project,
    removeStarter,
    renameLineup,
    saveCurrentLineup,
    saveProject,
    search,
    selectedPlayer,
    setActiveTeamId,
    setAnalyticsTarget,
    setFormation,
    setPosition,
    setSearch,
    setSelectedPlayerId,
    setSort,
    setStatMode,
    sort,
    starterPlayersBySlot,
    startingPlayers,
    statMode,
    useSavedLineupAsStarters,
  }
}
