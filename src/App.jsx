import AdminPage from './components/AdminPage'
import AnalyticsPanel from './components/AnalyticsPanel'
import ArchetypeLegend from './components/ArchetypeLegend'
import Court from './components/Court'
import FeaturedPlayerPanel from './components/FeaturedPlayerPanel'
import FeedbackModal from './components/FeedbackModal'
import GuidedTour, { GUIDED_TOUR_STORAGE_KEY } from './components/GuidedTour'
import WillDawkinsPage from './components/WillDawkinsPage'
import LineupCompare from './components/LineupCompare'
import SharedLineupPage from './components/SharedLineupPage'
import SharedLineupsPage from './components/SharedLineupsPage'
import PlayerPickerModal from './components/PlayerPickerModal'
import PlayerPool from './components/PlayerPool'
import useLineupLab from './hooks/useLineupLab'
import { useEffect, useState } from 'react'

import './styles/district-basketball-lab.css'

export default function App() {
  if (/^\/admin\/?$/i.test(window.location.pathname)) {
    return <AdminPage />
  }

  if (/^\/(will-dawkins|appreciation)\/?$/i.test(window.location.pathname)) {
    return <WillDawkinsPage />
  }

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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    const hasCompletedTour = window.localStorage.getItem(GUIDED_TOUR_STORAGE_KEY) === 'true'
    if (!hasCompletedTour) {
      const timer = window.setTimeout(() => setTourOpen(true), 650)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [])
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
          <button
            type="button"
            className="tour-replay-button"
            onClick={() => setTourOpen(true)}
          >
            Help / Tour
          </button>
          <button
            type="button"
            className="feedback-nav-button"
            onClick={() => setFeedbackOpen(true)}
          >
            Feedback
          </button>
          <a className="admin-nav-link" href="/admin">Admin</a>
          <label className="stat-view-control">
            <span>Stat View</span>
            <select
              value={statMode}
              onChange={(event) => setStatMode(event.target.value)}
              aria-label="Stat view"
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
              data-tour="lineup-editor"
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
                statMode={statMode}
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

            <div className="workbench-compare" data-tour="saved-lineups">
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

      <footer className="site-disclaimer">
        <strong>Unofficial fan project.</strong>
        <span>
          District Basketball Lab is not affiliated with, endorsed by, or
          sponsored by the NBA, the Washington Wizards, or their affiliates.
          Team names and marks belong to their respective owners.
        </span>
      </footer>

      <button
        type="button"
        className="floating-feedback-button"
        onClick={() => setFeedbackOpen(true)}
      >
        Feedback
      </button>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
      />

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
