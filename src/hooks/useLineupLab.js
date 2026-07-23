import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getTeamRoster } from '../services/playerDataService'
import { ensureAnonymousSession } from '../services/authService'
import {
  loadSavedLineupSlots,
  persistSavedLineupSlot,
  renameSavedLineupSlot,
  setSavedLineupVisibility,
} from '../services/savedLineupService'
import {
  loadLineupEditorState,
  persistLineupEditorState,
} from '../services/lineupEditorService'
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
  const [authUserId, setAuthUserId] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [savedLineupsLoading, setSavedLineupsLoading] = useState(false)
  const [savedLineupSyncError, setSavedLineupSyncError] = useState(null)
  const [editorStateReady, setEditorStateReady] = useState(false)
  const renameTimersRef = useRef(new Map())
  const editorSaveTimerRef = useRef(null)
  const loadedEditorStateKeyRef = useRef(null)
  const loadedSavedLineupsKeyRef = useRef(null)
  const savedLineupMutationVersionRef = useRef(0)

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

    const establishSession = async () => {
      setAuthLoading(true)

      try {
        const user = await ensureAnonymousSession()

        if (!cancelled) {
          setAuthUserId(user.id)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to establish anonymous session:', error)
          setSavedLineupSyncError(
            error instanceof Error
              ? error.message
              : 'Unable to establish a saved-lineup session.',
          )
        }
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    establishSession()

    return () => {
      cancelled = true
    }
  }, [])

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

  useEffect(() => {
    if (!authUserId || playerDataLoading || !rosterPlayers.length) return

    const loadKey = `${authUserId}:${activeTeam.id}`

    // Load each user's saved slots only once per team. This prevents a
    // later roster/state render from reapplying an older database copy.
    if (loadedSavedLineupsKeyRef.current === loadKey) return
    loadedSavedLineupsKeyRef.current = loadKey

    let cancelled = false
    const mutationVersionAtStart = savedLineupMutationVersionRef.current

    const loadRemoteSavedLineups = async () => {
      setSavedLineupsLoading(true)
      setSavedLineupSyncError(null)

      try {
        const remoteLineups = await loadSavedLineupSlots({
          teamId: activeTeam.id,
          rosterPlayers,
          defaultLineups: savedLineups,
        })

        const noNewerLocalChanges =
          mutationVersionAtStart ===
          savedLineupMutationVersionRef.current

        if (!cancelled && noNewerLocalChanges) {
          updateActiveTeam((currentTeam) => ({
            ...currentTeam,
            savedLineups: remoteLineups,
          }))
        }
      } catch (error) {
        // Allow a later retry if the first load failed.
        loadedSavedLineupsKeyRef.current = null

        if (!cancelled) {
          console.error('Unable to load saved lineups:', error)
          setSavedLineupSyncError(
            error instanceof Error
              ? error.message
              : 'Unable to load saved lineups.',
          )
        }
      } finally {
        if (!cancelled) setSavedLineupsLoading(false)
      }
    }

    loadRemoteSavedLineups()

    return () => {
      cancelled = true
    }
  }, [authUserId, activeTeam.id, playerDataLoading, rosterPlayers])

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

  useEffect(() => {
    if (!authUserId || playerDataLoading || !rosterPlayers.length) return

    const loadKey = `${authUserId}:${activeTeam.id}`
    if (loadedEditorStateKeyRef.current === loadKey) return

    loadedEditorStateKeyRef.current = loadKey
    setEditorStateReady(false)

    let cancelled = false

    const loadEditorState = async () => {
      try {
        const editorState = await loadLineupEditorState({
          teamId: activeTeam.id,
          rosterPlayers,
        })

        if (cancelled) return

        if (editorState) {
          updateActiveLineup((currentLineup) => ({
            ...currentLineup,
            starters: Object.fromEntries(
              Object.keys(currentLineup.starters).map((slot) => [
                slot,
                editorState.starters[slot] ?? null,
              ]),
            ),
          }))

          if (editorState.formation) {
            setFormation(editorState.formation)
          }

          const firstPlayerId =
            Object.values(editorState.starters).find(Boolean) || null

          setSelectedPlayerId(firstPlayerId)
          setAnalyticsTarget({ type: 'starters', index: null })
        }

        setEditorStateReady(true)
      } catch (error) {
        loadedEditorStateKeyRef.current = null

        if (!cancelled) {
          console.error('Unable to load Lineup Editor state:', error)
          setSavedLineupSyncError(
            error instanceof Error
              ? error.message
              : 'Unable to load the Lineup Editor.',
          )
          setEditorStateReady(true)
        }
      }
    }

    loadEditorState()

    return () => {
      cancelled = true
    }
  }, [authUserId, activeTeam.id, playerDataLoading, rosterPlayers])

  useEffect(() => {
    if (!editorStateReady || !authUserId || playerDataLoading) return

    if (editorSaveTimerRef.current) {
      window.clearTimeout(editorSaveTimerRef.current)
    }

    editorSaveTimerRef.current = window.setTimeout(async () => {
      try {
        await requireAuthenticatedUser()

        const starterDatabaseIds = Object.fromEntries(
          Object.entries(starters).map(([slot, playerId]) => [
            slot,
            playerId ? findPlayer(playerId)?.databaseId || null : null,
          ]),
        )

        await persistLineupEditorState({
          teamId: activeTeam.id,
          formation,
          starterDatabaseIds,
        })
      } catch (error) {
        console.error('Unable to save Lineup Editor state:', error)
        setSavedLineupSyncError(
          error instanceof Error
            ? error.message
            : 'Unable to save the Lineup Editor.',
        )
      }
    }, 500)

    return () => {
      if (editorSaveTimerRef.current) {
        window.clearTimeout(editorSaveTimerRef.current)
      }
    }
  }, [
    activeTeam.id,
    authUserId,
    editorStateReady,
    findPlayer,
    formation,
    playerDataLoading,
    starters,
  ])

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

  const permanentLineupNames = ['Starters', '2nd String', '3rd String']

  const hydratedLineups = useMemo(
    () =>
      savedLineups.map((lineup, index) => ({
        name: permanentLineupNames[index] || lineup.name,
        players: lineup.playerIds.map(findPlayer).filter(Boolean),
        canUndo: Boolean(lineup.previousPlayerIds?.length),
        databaseId: lineup.databaseId || null,
        isPublic: Boolean(lineup.isPublic),
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

  const clearStarters = () => {
    updateActiveLineup((currentLineup) => ({
      ...currentLineup,
      starters: Object.fromEntries(
        Object.keys(currentLineup.starters).map((slot) => [slot, null]),
      ),
    }))

    setSelectedPlayerId(null)
    setAnalyticsTarget({ type: 'starters', index: null })
    closePlayerPicker()
  }

  const useSavedLineupAsStarters = (lineupIndex) => {
    const savedLineup = savedLineups[lineupIndex]
    if (!savedLineup?.playerIds?.length) return

    const shouldReplace =
      startingIds.length === 0 ||
      window.confirm(
        `Move ${savedLineup.name} to Editor?`,
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

  const requireAuthenticatedUser = async () => {
    const user = await ensureAnonymousSession()
    setAuthUserId(user.id)
    return user
  }

  const getDatabaseIds = (playerIds = []) =>
    playerIds
      .map((playerId) => findPlayer(playerId)?.databaseId)
      .filter(Boolean)

  const saveCurrentLineup = async (lineupIndex) => {
    savedLineupMutationVersionRef.current += 1

    const currentSavedLineup = savedLineups[lineupIndex]
    const nextPlayerIds = [...startingIds]
    const previousPlayerIds = currentSavedLineup.playerIds?.length
      ? [...currentSavedLineup.playerIds]
      : null

    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map(
        (lineup, index) =>
          index === lineupIndex
            ? {
                ...lineup,
                previousPlayerIds,
                playerIds: nextPlayerIds,
              }
            : lineup,
      ),
    }))

    setAnalyticsTarget({ type: 'saved', index: lineupIndex })

    try {
      setSavedLineupSyncError(null)
      await requireAuthenticatedUser()

      const savedRecord = await persistSavedLineupSlot({
        teamId: activeTeam.id,
        season: '2025-26',
        slotIndex: lineupIndex,
        name:
          permanentLineupNames[lineupIndex] ||
          currentSavedLineup.name,
        formation,
        playerDatabaseIds: getDatabaseIds(nextPlayerIds),
        previousPlayerDatabaseIds: getDatabaseIds(
          previousPlayerIds || [],
        ),
      })

      updateActiveTeam((currentTeam) => ({
        ...currentTeam,
        savedLineups: currentTeam.savedLineups.map((lineup, index) =>
          index === lineupIndex
            ? {
                ...lineup,
                databaseId: savedRecord.id,
                isPublic: Boolean(savedRecord.is_public),
              }
            : lineup,
        ),
      }))
    } catch (error) {
      console.error('Unable to save lineup:', error)
      setSavedLineupSyncError(
        error instanceof Error ? error.message : 'Unable to save lineup.',
      )
    }
  }

  const undoSavedLineup = async (lineupIndex) => {
    savedLineupMutationVersionRef.current += 1

    const currentSavedLineup = savedLineups[lineupIndex]
    if (!currentSavedLineup.previousPlayerIds?.length) return

    const restoredPlayerIds = [...currentSavedLineup.previousPlayerIds]

    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map((lineup, index) =>
        index === lineupIndex
          ? {
              ...lineup,
              playerIds: restoredPlayerIds,
              previousPlayerIds: null,
            }
          : lineup,
      ),
    }))

    setAnalyticsTarget({ type: 'saved', index: lineupIndex })

    try {
      setSavedLineupSyncError(null)
      await requireAuthenticatedUser()

      const savedRecord = await persistSavedLineupSlot({
        teamId: activeTeam.id,
        season: '2025-26',
        slotIndex: lineupIndex,
        name:
          permanentLineupNames[lineupIndex] ||
          currentSavedLineup.name,
        formation,
        playerDatabaseIds: getDatabaseIds(restoredPlayerIds),
        previousPlayerDatabaseIds: [],
      })
    } catch (error) {
      console.error('Unable to undo saved lineup:', error)
      setSavedLineupSyncError(
        error instanceof Error
          ? error.message
          : 'Unable to restore saved lineup.',
      )
    }
  }

  const clearSavedLineup = async (lineupIndex) => {
    savedLineupMutationVersionRef.current += 1

    const currentSavedLineup = savedLineups[lineupIndex]
    if (!currentSavedLineup?.playerIds?.length) return

    const previousPlayerIds = [...currentSavedLineup.playerIds]
    const lineupName =
      permanentLineupNames[lineupIndex] || currentSavedLineup.name

    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map((lineup, index) =>
        index === lineupIndex
          ? {
              ...lineup,
              name: lineupName,
              playerIds: [],
              previousPlayerIds,
            }
          : lineup,
      ),
    }))

    if (
      analyticsTarget.type === 'saved' &&
      analyticsTarget.index === lineupIndex
    ) {
      setAnalyticsTarget({ type: 'starters', index: null })
    }

    try {
      setSavedLineupSyncError(null)
      await requireAuthenticatedUser()

      const savedRecord = await persistSavedLineupSlot({
        teamId: activeTeam.id,
        season: '2025-26',
        slotIndex: lineupIndex,
        name: lineupName,
        formation,
        playerDatabaseIds: [],
        previousPlayerDatabaseIds: getDatabaseIds(previousPlayerIds),
      })
    } catch (error) {
      console.error('Unable to clear saved lineup:', error)
      setSavedLineupSyncError(
        error instanceof Error
          ? error.message
          : 'Unable to clear saved lineup.',
      )
    }
  }

  const renameLineup = (lineupIndex, name) => {
    if (lineupIndex < 3) return

    savedLineupMutationVersionRef.current += 1

    updateActiveTeam((currentTeam) => ({
      ...currentTeam,
      savedLineups: currentTeam.savedLineups.map(
        (lineup, index) =>
          index === lineupIndex ? { ...lineup, name } : lineup,
      ),
    }))

    const previousTimer = renameTimersRef.current.get(lineupIndex)
    if (previousTimer) window.clearTimeout(previousTimer)

    const timer = window.setTimeout(async () => {
      renameTimersRef.current.delete(lineupIndex)

      try {
        await requireAuthenticatedUser()

        await renameSavedLineupSlot({
          teamId: activeTeam.id,
          slotIndex: lineupIndex,
          name,
        })
      } catch (error) {
        console.error('Unable to rename saved lineup:', error)
        setSavedLineupSyncError(
          error instanceof Error
            ? error.message
            : 'Unable to rename saved lineup.',
        )
      }
    }, 600)

    renameTimersRef.current.set(lineupIndex, timer)
  }

  const toggleSavedLineupVisibility = async (lineupIndex) => {
    const lineup = savedLineups[lineupIndex]
    if (!lineup?.playerIds?.length) return

    const nextIsPublic = !lineup.isPublic

    try {
      setSavedLineupSyncError(null)
      await requireAuthenticatedUser()

      const updated = await setSavedLineupVisibility({
        teamId: activeTeam.id,
        slotIndex: lineupIndex,
        isPublic: nextIsPublic,
      })

      updateActiveTeam((currentTeam) => ({
        ...currentTeam,
        savedLineups: currentTeam.savedLineups.map((saved, index) =>
          index === lineupIndex
            ? {
                ...saved,
                databaseId: updated.id,
                isPublic: Boolean(updated.is_public),
              }
            : saved,
        ),
      }))
    } catch (error) {
      console.error('Unable to change lineup visibility:', error)
      setSavedLineupSyncError(
        error instanceof Error
          ? error.message
          : 'Unable to change lineup visibility.',
      )
    }
  }

  const sharePublicLineups = async () => {
    try {
      const user = await requireAuthenticatedUser()
      const publicCompleteCount = savedLineups.filter(
        (lineup) =>
          lineup.isPublic && lineup.playerIds?.length === 5,
      ).length

      if (!publicCompleteCount) {
        window.alert(
          'Make at least one complete five-player lineup public first.',
        )
        return
      }

      const shareUrl =
        `${window.location.origin}/lineups/${user.id}/` +
        encodeURIComponent(activeTeam.id)

      let copied = false

      try {
        await navigator.clipboard.writeText(shareUrl)
        copied = true
      } catch {
        window.prompt('Copy this lineup collection link:', shareUrl)
      }

      if (copied) {
        window.alert(
          `${publicCompleteCount} public lineup${
            publicCompleteCount === 1 ? '' : 's'
          } copied. Opening the shared lineup page now.`,
        )
      }

      window.location.assign(shareUrl)
    } catch (error) {
      console.error('Unable to share lineup collection:', error)
      setSavedLineupSyncError(
        error instanceof Error
          ? error.message
          : 'Unable to share lineup collection.',
      )
    }
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
    authLoading,
    authUserId,
    analyticsTarget,
    analyzedLineup,
    availablePlayers,
    availableTeams,
    choosePlayer,
    clearSavedLineup,
    clearStarters,
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
    sharePublicLineups,
    toggleSavedLineupVisibility,
    saveProject,
    savedLineupsLoading,
    savedLineupSyncError,
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
    undoSavedLineup,
    useSavedLineupAsStarters,
  }
}
