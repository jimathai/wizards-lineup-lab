import PlayerCard from './PlayerCard'

export default function PlayerPool({
  players,
  statMode,
  search,
  setSearch,
  position,
  setPosition,
  sort,
  setSort,
  onSelectPlayer,
  loading = false,
  error = null,
}) {
  return (
    <aside className="roster-panel">
      <div className="roster-search-wrap">
        <input
          className="roster-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search players..."
          disabled={loading}
        />
      </div>

      <div className="roster-filters">
        <label>
          Position
          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            disabled={loading}
          >
            <option value="">All</option>
            <option value="G">G</option>
            <option value="F">F</option>
            <option value="C">C</option>
          </select>
        </label>

        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            disabled={loading}
          >
            <option value="name">Name</option>
            <option value="pts">PPG</option>
          </select>
        </label>
      </div>

      <div className="roster-list">
        {loading && (
          <p className="roster-status">Loading roster…</p>
        )}

        {!loading && error && (
          <p className="roster-status roster-status-error">
            {error}
          </p>
        )}

        {!loading && !error && players.length === 0 && (
          <p className="roster-status">No players found.</p>
        )}

        {!loading &&
          !error &&
          players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              statMode={statMode}
              compact
              onSelect={onSelectPlayer}
            />
          ))}
      </div>
    </aside>
  )
}
