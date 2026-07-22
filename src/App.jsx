import AnalyticsPanel from './components/AnalyticsPanel'
import ArchetypeLegend from './components/ArchetypeLegend'
import Court from './components/Court'
import FeaturedPlayerPanel from './components/FeaturedPlayerPanel'
import LineupCompare from './components/LineupCompare'
import SharedLineupPage from './components/SharedLineupPage'
import SharedLineupsPage from './components/SharedLineupsPage'
import PlayerPickerModal from './components/PlayerPickerModal'
import PlayerPool from './components/PlayerPool'
import useLineupLab from './hooks/useLineupLab'

import './styles/district-basketball-lab.css'

export default function App() {
  const sharedLineupsMatch = window.location.pathname.match(
    /^\/lineups\/([0-9a-f-]+)\/([^/]+)\/?$/i,
  )

  if (sharedLineupsMatch) {
    return (
      <SharedLineupsPage
        ownerId={sharedLineupsMatch[1]}
        teamId={decodeURIComponent(sharedLineupsMatch[2])}
      />
    )
  }

  const sharedLineupMatch = window.location.pathname.match(
    /^\/lineup\/([0-9a-f-]+)\/?$/i,
  )

  if (sharedLineupMatch) {
    return <SharedLineupPage lineupId={sharedLineupMatch[1]} />
  }

  return <LineupLabApp />
}

function LineupLabApp() {
  const {
    activeTeam,
    analyticsTarget,
    analyzedLineup,
    availablePlayers,
    availableTeams,
    choosePlayer,
    clearSavedLineup,
    clearStarters,
    closePlayerPicker,
    filteredPlayerPool,
    playerDataError,
    playerDataLoading,
    formation,
    hydratedLineups,
    openPlayerPicker,
    pickerAnchor,
    pickerTarget,
    placeStarter,
    position,
    removeStarter,
    renameLineup,
    saveCurrentLineup,
    sharePublicLineups,
    toggleSavedLineupVisibility,
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
  } = useLineupLab()

  const teamTheme = {
    '--team-primary': activeTeam.primaryColor || '#002B5C',
    '--team-secondary': activeTeam.secondaryColor || '#E31837',
    '--team-accent': activeTeam.accentColor || '#FFFFFF',
    '--team-surface': activeTeam.surfaceColor || '#0b1728',
    '--team-glow': activeTeam.glowColor || activeTeam.secondaryColor || '#E31837',
  }

  return (
    <div
      className="app-frame"
      data-team={activeTeam.id}
      style={teamTheme}
    >
      <header className="top-bar district-top-bar">
        <div className="brand-block district-brand-block">
          <div className="brand-mark district-brand-mark">
            {activeTeam.imgURL ? (
              <img
                src={activeTeam.imgURL}
                alt={`${activeTeam.city} ${activeTeam.name} logo`}
              />
            ) : (
              activeTeam.abbreviation
            )}
          </div>

          <div>
            <h1>District Basketball Lab</h1>
            <span>{activeTeam.city} {activeTeam.name} Edition</span>
          </div>
        </div>

        <div className="top-controls">
          <label>
            Stats
            <select
              value={statMode}
              onChange={(event) => setStatMode(event.target.value)}
            >
              <option value="current">2025–26</option>
              <option value="career">Career</option>
            </select>
          </label>
        </div>
      </header>

      <main className="dashboard-grid">
        <PlayerPool
          players={filteredPlayerPool}
          loading={playerDataLoading}
          error={playerDataError}
          statMode={statMode}
          search={search}
          setSearch={setSearch}
          position={position}
          setPosition={setPosition}
          sort={sort}
          setSort={setSort}
          onSelectPlayer={setSelectedPlayerId}
        />

        <section className="main-column">
          <section className="lineup-workbench">
            <div
              className={`workbench-court analytics-source ${
                analyticsTarget.type === 'starters'
                  ? 'analytics-source-active'
                  : ''
              }`}
              onClick={() =>
                setAnalyticsTarget({ type: 'starters', index: null })
              }
            >
              <Court
                starters={starterPlayersBySlot}
                formation={formation}
                statMode={statMode}
                onFormationChange={setFormation}
                onDropPlayer={placeStarter}
                onRemove={removeStarter}
                onOpenPicker={openPlayerPicker}
                onSelectPlayer={setSelectedPlayerId}
                onClear={clearStarters}
              />
            </div>

            <div className="workbench-featured">
              <FeaturedPlayerPanel
                player={selectedPlayer}
                statMode={statMode}
              />
            </div>

            <div className="workbench-compare">
              <LineupCompare
                lineups={hydratedLineups}
                statMode={statMode}
                onSave={saveCurrentLineup}
                onRename={renameLineup}
                onSetStarters={useSavedLineupAsStarters}
                onUndo={undoSavedLineup}
                onClear={clearSavedLineup}
                onToggleVisibility={toggleSavedLineupVisibility}
                onShareLineups={sharePublicLineups}
                selectedIndex={
                  analyticsTarget.type === 'saved'
                    ? analyticsTarget.index
                    : null
                }
                onSelect={(index) =>
                  setAnalyticsTarget({ type: 'saved', index })
                }
              />
            </div>

            <div className="workbench-analytics">
              <AnalyticsPanel
                players={analyzedLineup.players}
                statMode={statMode}
                lineupName={analyzedLineup.name}
              />
            </div>
          </section>

          <ArchetypeLegend
            players={startingPlayers}
            statMode={statMode}
          />

        </section>
      </main>

      <PlayerPickerModal
        open={Boolean(pickerTarget)}
        players={availablePlayers}
        anchor={pickerAnchor}
        statMode={statMode}
        onSelect={choosePlayer}
        onClose={closePlayerPicker}
      />
    </div>
  )
}
