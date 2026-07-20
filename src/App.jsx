import AnalyticsPanel from './components/AnalyticsPanel'
import ArchetypeLegend from './components/ArchetypeLegend'
import Court from './components/Court'
import FeaturedPlayerPanel from './components/FeaturedPlayerPanel'
import LineupCompare from './components/LineupCompare'
import PlayerPickerModal from './components/PlayerPickerModal'
import PlayerPool from './components/PlayerPool'
import useLineupLab from './hooks/useLineupLab'

import './styles/district-basketball-lab.css'

export default function App() {
  const {
    activeTeam,
    analyticsTarget,
    analyzedLineup,
    availablePlayers,
    availableTeams,
    choosePlayer,
    closePlayerPicker,
    copyShareLink,
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
  } = useLineupLab()

  const teamColors = activeTeam.colors || {}
  const teamStyle = {
    '--team-primary': teamColors.primary || '#002B5C',
    '--team-secondary': teamColors.secondary || '#E31837',
    '--team-neutral': teamColors.neutral || '#FFFFFF',
    '--team-blossom': teamColors.blossom || '#E98BA7',
    '--team-blossom-deep': teamColors.blossomDeep || '#8C3558',
    '--team-gold': teamColors.alternate || '#D6B36A',
    '--team-black': teamColors.alternateDark || '#0A0A0A',
  }

  return (
    <div className="app-frame" style={teamStyle}>
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

          <div className="district-brand-copy">
            <span className="district-brand-kicker">District Basketball Lab</span>
            <h1>{activeTeam.city} {activeTeam.name}</h1>
            <span className="district-brand-subtitle">Lineup & roster workbench</span>
          </div>
        </div>

        <div className="top-controls">
          <label>
            Team
            <select
              value={activeTeam.id}
              onChange={(event) => setActiveTeamId(event.target.value)}
            >
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.abbreviation} · {team.city} {team.name}
                </option>
              ))}
            </select>
          </label>

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


          <button type="button" onClick={saveProject}>
            Save Lineup
          </button>

          <button
            type="button"
            className="share-button"
            onClick={copyShareLink}
          >
            Copy Share Link
          </button>
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
