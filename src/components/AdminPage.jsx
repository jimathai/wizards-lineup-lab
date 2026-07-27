import { useCallback, useEffect, useMemo, useState } from 'react'
import { resolvePlayerImageUrl } from '../config/playerImages'
import {
  getAdminReferenceData,
  getCurrentAdmin,
  applyNbaStatsUpdates,
  previewNbaStatsUpdates,
  savePlayerRecord,
  setPlayerRosterActive,
  signInAdmin,
  signOutAdmin,
} from '../services/adminService'

const emptyStats = () => ({
  pts: '',
  reb: '',
  ast: '',
  stl: '',
  blk: '',
  tov: '',
  threePm: '',
  fgPct: '',
  ftPct: '',
  threePct: '',
  plusMinus: '',
  trueShootingPct: '',
  competition: 'nba',
  sourceName: '',
})

const emptyForm = (teamId = 'wizards') => ({
  slug: '',
  firstName: '',
  lastName: '',
  displayName: '',
  primaryPosition: '',
  secondaryPosition: '',
  archetype: '',
  birthDate: '',
  age: '',
  experience: '',
  collegeCountry: '',
  nbaPlayerId: '',
  legacyPlayerId: '',
  imageUrlOverride: '',
  draftYear: '',
  draftPick: '',
  shootingHand: '',
  isActive: true,
  teamId,
  season: '2025-26',
  jerseyNumber: '',
  rosterPosition: '',
  rosterStatus: 'active',
  rosterActive: true,
  height: '',
  weight: '',
  vertical: '',
  wingspan: '',
  standingReach: '',
  measurementType: 'admin',
  measurementSource: '',
  measurementNotes: '',
  currentStats: emptyStats(),
  careerStats: emptyStats(),
})

const statValue = (stats, key) =>
  stats?.[key] === null || stats?.[key] === undefined
    ? ''
    : stats[key]

const recordToForm = (record) => {
  const { player, roster, measurements, currentStats, careerStats } = record

  const mapStats = (stats) => ({
    pts: statValue(stats, 'points_per_game'),
    reb: statValue(stats, 'rebounds_per_game'),
    ast: statValue(stats, 'assists_per_game'),
    stl: statValue(stats, 'steals_per_game'),
    blk: statValue(stats, 'blocks_per_game'),
    tov: statValue(stats, 'turnovers_per_game'),
    threePm: statValue(stats, 'three_pointers_made_per_game'),
    fgPct: statValue(stats, 'field_goal_percentage'),
    ftPct: statValue(stats, 'free_throw_percentage'),
    threePct: statValue(stats, 'three_point_percentage'),
    plusMinus: statValue(stats, 'plus_minus'),
    trueShootingPct: statValue(stats, 'true_shooting_percentage'),
    competition: stats?.competition || 'nba',
    sourceName: stats?.source_name || '',
  })

  return {
    slug: player.slug || '',
    firstName: player.first_name || '',
    lastName: player.last_name || '',
    displayName: player.display_name || '',
    primaryPosition: player.primary_position || '',
    secondaryPosition: player.secondary_position || '',
    archetype: player.archetype || '',
    birthDate: player.birth_date || '',
    age: player.age ?? '',
    experience: player.experience_years ?? '',
    collegeCountry: player.college_country || '',
    nbaPlayerId: player.nba_player_id ?? '',
    legacyPlayerId: player.legacy_player_id ?? '',
    imageUrlOverride: player.image_url_override || '',
    draftYear: player.draft_year ?? '',
    draftPick: player.draft_pick ?? '',
    shootingHand: player.shooting_hand || '',
    isActive: player.is_active !== false,
    teamId: roster?.team_id || 'wizards',
    season: roster?.season || '2025-26',
    jerseyNumber: roster?.jersey_number || '',
    rosterPosition: roster?.roster_position || '',
    rosterStatus: roster?.roster_status || 'active',
    rosterActive: roster?.is_active !== false,
    height: measurements?.height_inches ?? '',
    weight: measurements?.weight_pounds ?? '',
    vertical: measurements?.vertical_inches ?? '',
    wingspan: measurements?.wingspan_inches ?? '',
    standingReach: measurements?.standing_reach_inches ?? '',
    measurementType: measurements?.measurement_type || 'admin',
    measurementSource: measurements?.source_name || '',
    measurementNotes: measurements?.notes || '',
    currentStats: mapStats(currentStats),
    careerStats: mapStats(careerStats),
  }
}

const getAudit = (record) => {
  const { player, roster, measurements, currentStats, careerStats } = record
  const missing = []

  if (!player.display_name) missing.push('Name')
  if (!player.primary_position) missing.push('Position')
  if (!player.archetype) missing.push('Archetype')
  if (player.age == null && !player.birth_date) missing.push('Age/Birthday')
  if (player.experience_years == null) missing.push('Experience')
  if (!player.college_country) missing.push('From')
  if (!player.nba_player_id && !player.image_url_override) {
    missing.push('Image')
  }
  if (!player.draft_year) missing.push('Draft')
  if (!player.shooting_hand) missing.push('Hand')
  if (!roster) missing.push('Roster')
  if (!measurements?.height_inches) missing.push('Height')
  if (!measurements?.weight_pounds) missing.push('Weight')
  if (!measurements?.wingspan_inches) missing.push('Wingspan')
  if (!measurements?.standing_reach_inches) missing.push('Reach')
  if (!measurements?.vertical_inches) missing.push('Vertical')
  if (currentStats?.points_per_game == null) missing.push('Current stats')
  if (careerStats?.points_per_game == null) missing.push('Career stats')
  if (currentStats?.true_shooting_percentage == null) missing.push('TS%')
  if (currentStats?.plus_minus == null) missing.push('+/-')

  return {
    missing,
    complete: missing.length === 0,
    score: Math.max(0, Math.round(((19 - missing.length) / 19) * 100)),
  }
}


const importStatFields = [
  ['PTS', 'pts'],
  ['REB', 'reb'],
  ['AST', 'ast'],
  ['STL', 'stl'],
  ['BLK', 'blk'],
  ['TOV', 'tov'],
  ['3PM', 'threePm'],
  ['FG%', 'fgPct'],
  ['3P%', 'threePct'],
  ['FT%', 'ftPct'],
  ['+/-', 'plusMinus'],
  ['TS%', 'trueShootingPct'],
]


const importBioFields = [
  ['Pos', 'position'],
  ['Age', 'age'],
  ['Exp', 'experience'],
  ['College/Country', 'collegeCountry'],
  ['Draft Year', 'draftYear'],
  ['Pick', 'draftPick'],
  ['Height', 'heightInches'],
  ['Weight', 'weightPounds'],
  ['Wingspan', 'wingspanInches'],
  ['Reach', 'standingReachInches'],
  ['Vertical', 'verticalInches'],
]

const displayMeasurement = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number)
    ? `${Math.round(number * 10) / 10}${suffix}`
    : String(value)
}

const displayImportStat = (value, percentage = false) => {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  const shown = percentage && Math.abs(number) <= 1 ? number * 100 : number
  return `${Math.round(shown * 10) / 10}${percentage ? '%' : ''}`
}

function NbaImportPanel({
  season,
  onSeasonChange,
  rows,
  loading,
  applying,
  onPreview,
  onApply,
  onClose,
}) {
  const matched = rows.filter((row) => row.status === 'matched')
  const missingId = rows.filter((row) => row.status === 'missing-id')
  const notFound = rows.filter((row) => row.status === 'not-found')

  return (
    <section className="admin-nba-import-panel">
      <div className="admin-nba-import-heading">
        <div>
          <span className="admin-kicker">NBA.com Stats</span>
          <h2>Import Current-Season Statistics</h2>
          <p>
            Preview changes before updating Supabase. This imports current-season stats, player bio and draft data, plus official combine measurements when available.
          </p>
        </div>

        <button type="button" onClick={onClose}>Close</button>
      </div>

      <div className="admin-nba-import-toolbar">
        <label>
          <span>Season</span>
          <input
            value={season}
            onChange={(event) => onSeasonChange(event.target.value)}
            placeholder="2025-26"
          />
        </label>
        <button
          type="button"
          className="admin-primary-button"
          onClick={onPreview}
          disabled={loading || applying}
        >
          {loading ? 'Loading NBA Data…' : 'Preview NBA Data'}
        </button>
        {rows.length > 0 && (
          <button
            type="button"
            className="admin-primary-button"
            onClick={onApply}
            disabled={!matched.length || applying || loading}
          >
            {applying ? 'Applying…' : `Apply ${matched.length} Updates`}
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="admin-nba-import-summary">
            <span><strong>{matched.length}</strong> matched</span>
            <span><strong>{missingId.length}</strong> missing NBA ID</span>
            <span><strong>{notFound.length}</strong> not found</span>
          </div>

          <div className="admin-nba-import-table-wrap">
            <table className="admin-nba-import-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Status</th>
                  {importStatFields.map(([label]) => <th key={label}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ record, nba, status }) => (
                  <tr key={`${record.player.id}:${record.roster?.team_id || 'none'}`}>
                    <td>
                      <strong>{record.player.display_name}</strong>
                      <small>{record.player.nba_player_id || 'No NBA ID'}</small>
                    </td>
                    <td>
                      <span className={`admin-import-status admin-import-${status}`}>
                        {status === 'matched'
                          ? 'Ready'
                          : status === 'missing-id'
                            ? 'Missing ID'
                            : 'Not found'}
                      </span>
                    </td>
                    {importStatFields.map(([label, key]) => (
                      <td key={key}>
                        {nba
                          ? displayImportStat(
                              nba[key],
                              ['fgPct', 'threePct', 'ftPct', 'trueShootingPct']
                                .includes(key),
                            )
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-nba-import-table-wrap admin-nba-bio-table-wrap">
            <h3>NBA Bio and Combine Preview</h3>
            <table className="admin-nba-import-table admin-nba-bio-table">
              <thead>
                <tr>
                  <th>Player</th>
                  {importBioFields.map(([label]) => <th key={label}>{label}</th>)}
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ record, nba }) => (
                  <tr key={`bio:${record.player.id}:${record.roster?.team_id || 'none'}`}>
                    <td><strong>{record.player.display_name}</strong></td>
                    {importBioFields.map(([label, key]) => (
                      <td key={key}>
                        {nba
                          ? key === 'heightInches' || key === 'wingspanInches' ||
                            key === 'standingReachInches' || key === 'verticalInches'
                            ? displayMeasurement(nba[key], '\"')
                            : key === 'weightPounds'
                              ? displayMeasurement(nba[key], ' lbs')
                              : nba[key] ?? '—'
                          : '—'}
                      </td>
                    ))}
                    <td>{nba?.measurementSource || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? 'admin-field admin-field-wide' : 'admin-field'}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function NumberInput({ value, onChange, step = 'any' }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function StatsEditor({ title, value, onChange }) {
  const set = (key, nextValue) =>
    onChange({
      ...value,
      [key]: nextValue,
    })

  return (
    <section className="admin-form-section">
      <h3>{title}</h3>
      <div className="admin-form-grid admin-stats-grid">
        {[
          ['Pts', 'pts'],
          ['Reb', 'reb'],
          ['Ast', 'ast'],
          ['Stl', 'stl'],
          ['Blk', 'blk'],
          ['TOV', 'tov'],
          ['3PM', 'threePm'],
          ['FG%', 'fgPct'],
          ['FT%', 'ftPct'],
          ['3P%', 'threePct'],
          ['+/-', 'plusMinus'],
          ['TS%', 'trueShootingPct'],
        ].map(([label, key]) => (
          <Field label={label} key={key}>
            <NumberInput
              value={value[key]}
              onChange={(nextValue) => set(key, nextValue)}
            />
          </Field>
        ))}

        <Field label="Competition">
          <select
            value={value.competition}
            onChange={(event) => set('competition', event.target.value)}
          >
            <option value="nba">NBA</option>
            <option value="college">College</option>
            <option value="g-league">G League</option>
            <option value="international">International</option>
          </select>
        </Field>

        <Field label="Source" wide>
          <input
            value={value.sourceName}
            onChange={(event) => set('sourceName', event.target.value)}
          />
        </Field>
      </div>
    </section>
  )
}

function PlayerEditor({
  record,
  teams,
  initialTeamId,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(() =>
    record ? recordToForm(record) : emptyForm(initialTeamId || teams[0]?.id),
  )
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

  const imagePreview = imageFile
    ? URL.createObjectURL(imageFile)
    : resolvePlayerImageUrl({
        imageUrlOverride: form.imageUrlOverride,
        nbaPlayerId: form.nbaPlayerId,
        legacyImageUrl: '',
      })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.slug || !form.displayName || !form.firstName || !form.lastName) {
      setError('Slug, first name, last name, and display name are required.')
      return
    }

    try {
      setSaving(true)
      await savePlayerRecord({
        playerId: record?.player.id || null,
        form,
        imageFile,
      })
      await onSaved()
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the player.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-player-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-heading">
        <div>
          <span className="admin-kicker">
            {record ? 'Edit player' : 'Add player'}
          </span>
          <h2>{form.displayName || 'New Player'}</h2>
        </div>

        <div className="admin-editor-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save Player'}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-form-section admin-profile-section">
        <div className="admin-image-editor">
          <div className="admin-image-preview">
            {imagePreview ? (
              <img src={imagePreview} alt="" />
            ) : (
              <span>No image</span>
            )}
          </div>

          <Field label="Upload custom image">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] || null)
              }
            />
          </Field>

          <Field label="Image override URL">
            <input
              value={form.imageUrlOverride}
              onChange={(event) =>
                set('imageUrlOverride', event.target.value)
              }
            />
          </Field>

          <Field label="NBA player ID">
            <NumberInput
              value={form.nbaPlayerId}
              onChange={(value) => set('nbaPlayerId', value)}
              step="1"
            />
          </Field>
        </div>

        <div className="admin-form-grid">
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(event) => set('slug', event.target.value)}
            />
          </Field>
          <Field label="Display name">
            <input
              value={form.displayName}
              onChange={(event) => set('displayName', event.target.value)}
            />
          </Field>
          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(event) => set('firstName', event.target.value)}
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(event) => set('lastName', event.target.value)}
            />
          </Field>
          <Field label="Primary position">
            <input
              value={form.primaryPosition}
              onChange={(event) => set('primaryPosition', event.target.value)}
            />
          </Field>
          <Field label="Secondary position">
            <input
              value={form.secondaryPosition}
              onChange={(event) => set('secondaryPosition', event.target.value)}
            />
          </Field>
          <Field label="Archetype">
            <input
              value={form.archetype}
              onChange={(event) => set('archetype', event.target.value)}
            />
          </Field>
          <Field label="Birth date">
            <input
              type="date"
              value={form.birthDate}
              onChange={(event) => set('birthDate', event.target.value)}
            />
          </Field>
          <Field label="Age">
            <NumberInput
              value={form.age}
              onChange={(value) => set('age', value)}
              step="1"
            />
          </Field>
          <Field label="Experience">
            <NumberInput
              value={form.experience}
              onChange={(value) => set('experience', value)}
              step="1"
            />
          </Field>
          <Field label="College / country">
            <input
              value={form.collegeCountry}
              onChange={(event) => set('collegeCountry', event.target.value)}
            />
          </Field>
          <Field label="Shooting hand">
            <select
              value={form.shootingHand}
              onChange={(event) => set('shootingHand', event.target.value)}
            >
              <option value="">Unknown</option>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
              <option value="Both">Both</option>
            </select>
          </Field>
          <Field label="Draft year">
            <NumberInput
              value={form.draftYear}
              onChange={(value) => set('draftYear', value)}
              step="1"
            />
          </Field>
          <Field label="Draft pick">
            <NumberInput
              value={form.draftPick}
              onChange={(value) => set('draftPick', value)}
              step="1"
            />
          </Field>
          <Field label="Legacy player ID">
            <NumberInput
              value={form.legacyPlayerId}
              onChange={(value) => set('legacyPlayerId', value)}
              step="1"
            />
          </Field>
          <Field label="Player active">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => set('isActive', event.target.checked)}
            />
          </Field>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Roster</h3>
        <div className="admin-form-grid">
          <Field label="Team">
            <select
              value={form.teamId}
              onChange={(event) => set('teamId', event.target.value)}
            >
              {teams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.city} {team.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Season">
            <input
              value={form.season}
              onChange={(event) => set('season', event.target.value)}
            />
          </Field>
          <Field label="Jersey number">
            <input
              value={form.jerseyNumber}
              onChange={(event) => set('jerseyNumber', event.target.value)}
            />
          </Field>
          <Field label="Roster position">
            <input
              value={form.rosterPosition}
              onChange={(event) => set('rosterPosition', event.target.value)}
            />
          </Field>
          <Field label="Roster status">
            <select
              value={form.rosterStatus}
              onChange={(event) => set('rosterStatus', event.target.value)}
            >
              <option value="active">Active</option>
              <option value="two-way">Two-way</option>
              <option value="inactive">Inactive</option>
              <option value="waived">Waived</option>
            </select>
          </Field>
          <Field label="On active roster">
            <input
              type="checkbox"
              checked={form.rosterActive}
              onChange={(event) => set('rosterActive', event.target.checked)}
            />
          </Field>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Measurements</h3>
        <div className="admin-form-grid">
          {[
            ['Height (inches)', 'height'],
            ['Weight (lbs)', 'weight'],
            ['Vertical (inches)', 'vertical'],
            ['Wingspan (inches)', 'wingspan'],
            ['Standing reach (inches)', 'standingReach'],
          ].map(([label, key]) => (
            <Field label={label} key={key}>
              <NumberInput
                value={form[key]}
                onChange={(value) => set(key, value)}
              />
            </Field>
          ))}
          <Field label="Measurement type">
            <input
              value={form.measurementType}
              onChange={(event) => set('measurementType', event.target.value)}
            />
          </Field>
          <Field label="Source" wide>
            <input
              value={form.measurementSource}
              onChange={(event) => set('measurementSource', event.target.value)}
            />
          </Field>
          <Field label="Notes" wide>
            <textarea
              value={form.measurementNotes}
              onChange={(event) => set('measurementNotes', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <StatsEditor
        title="Current season statistics"
        value={form.currentStats}
        onChange={(value) => set('currentStats', value)}
      />

      <StatsEditor
        title="Career statistics"
        value={form.careerStats}
        onChange={(value) => set('careerStats', value)}
      />
    </form>
  )
}

function LoginPanel({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      setWorking(true)
      await signInAdmin({ email, password })
      await onSignedIn()
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={submit}>
        <span className="admin-kicker">District Basketball Lab</span>
        <h1>Admin Sign In</h1>
        <p>Use the email account marked as an administrator in Supabase.</p>

        {error && <div className="admin-error">{error}</div>}

        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <button type="submit" className="admin-primary-button" disabled={working}>
          {working ? 'Signing in…' : 'Sign In'}
        </button>

        <a href="/">Return to Lineup Lab</a>
      </form>
    </main>
  )
}

export default function AdminPage() {
  const [admin, setAdmin] = useState(undefined)
  const [teams, setTeams] = useState([])
  const [records, setRecords] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [filter, setFilter] = useState('incomplete')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('completeness')
  const [sortDirection, setSortDirection] = useState('asc')
  const [updatingPlayerId, setUpdatingPlayerId] = useState(null)
  const [showNbaImport, setShowNbaImport] = useState(false)
  const [nbaImportSeason, setNbaImportSeason] = useState('2025-26')
  const [nbaImportRows, setNbaImportRows] = useState([])
  const [nbaImportLoading, setNbaImportLoading] = useState(false)
  const [nbaImportApplying, setNbaImportApplying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAdmin = useCallback(async () => {
    const currentAdmin = await getCurrentAdmin()
    setAdmin(currentAdmin)
    return currentAdmin
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminReferenceData()
      setTeams(data.teams)
      setRecords(data.records)
      setSelectedTeamId((current) => {
        if (current && data.teams.some((team) => team.id === current)) {
          return current
        }

        return (
          data.teams.find((team) => team.id === 'wizards')?.id ||
          data.teams.find((team) => team.is_active !== false)?.id ||
          data.teams[0]?.id ||
          'unassigned'
        )
      })
    } catch (loadError) {
      setError(loadError.message || 'Unable to load admin data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdmin()
      .then((currentAdmin) => {
        if (currentAdmin) return loadData()
        setLoading(false)
        return null
      })
      .catch((loadError) => {
        setError(loadError.message || 'Unable to verify admin access.')
        setAdmin(null)
        setLoading(false)
      })
  }, [loadAdmin, loadData])

  const auditedRecords = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        audit: getAudit(record),
      })),
    [records],
  )

  const teamRecords = useMemo(() => {
    if (!selectedTeamId) return auditedRecords

    if (selectedTeamId === 'unassigned') {
      return auditedRecords.filter((record) => !record.roster)
    }

    return auditedRecords.filter(
      (record) => record.roster?.team_id === selectedTeamId,
    )
  }, [auditedRecords, selectedTeamId])

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = teamRecords.filter((record) => {
      if (filter === 'complete' && !record.audit.complete) return false
      if (filter === 'incomplete' && record.audit.complete) return false
      if (filter === 'active' && record.roster?.is_active === false) return false
      if (filter === 'inactive' && record.roster?.is_active !== false) return false
      if (filter === 'images' && !record.audit.missing.includes('Image')) return false
      if (
        filter === 'measurements' &&
        !record.audit.missing.some((value) =>
          ['Height', 'Weight', 'Wingspan', 'Reach', 'Vertical'].includes(value),
        )
      ) {
        return false
      }
      if (
        filter === 'stats' &&
        !record.audit.missing.some((value) =>
          ['Current stats', 'Career stats', 'TS%', '+/-'].includes(value),
        )
      ) {
        return false
      }

      if (!normalizedQuery) return true

      return [
        record.player.display_name,
        record.player.slug,
        record.player.archetype,
        record.roster?.team_id,
        record.roster?.jersey_number,
        record.roster?.roster_position,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedQuery),
        )
    })

    const direction = sortDirection === 'asc' ? 1 : -1

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') {
        return left.player.display_name.localeCompare(
          right.player.display_name,
        ) * direction
      }

      if (sortBy === 'jersey') {
        const leftNumber = Number(left.roster?.jersey_number)
        const rightNumber = Number(right.roster?.jersey_number)
        const leftValue = Number.isFinite(leftNumber) ? leftNumber : 999
        const rightValue = Number.isFinite(rightNumber) ? rightNumber : 999
        return (leftValue - rightValue) * direction
      }

      if (sortBy === 'status') {
        const leftValue = left.roster?.is_active === false ? 1 : 0
        const rightValue = right.roster?.is_active === false ? 1 : 0
        return (leftValue - rightValue) * direction
      }

      if (sortBy === 'missing') {
        return (left.audit.missing.length - right.audit.missing.length) * direction
      }

      return (left.audit.score - right.audit.score) * direction
    })
  }, [teamRecords, filter, query, sortBy, sortDirection])

  const summary = useMemo(
    () => ({
      total: teamRecords.length,
      complete: teamRecords.filter((record) => record.audit.complete).length,
      missingImages: teamRecords.filter((record) =>
        record.audit.missing.includes('Image'),
      ).length,
      missingMeasurements: teamRecords.filter((record) =>
        record.audit.missing.some((value) =>
          ['Height', 'Weight', 'Wingspan', 'Reach', 'Vertical'].includes(value),
        ),
      ).length,
    }),
    [teamRecords],
  )

  const setSort = (column) => {
    if (sortBy === column) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortBy(column)
    setSortDirection(column === 'completeness' ? 'asc' : 'asc')
  }

  const sortIndicator = (column) =>
    sortBy === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''

  const handleQuickStatus = async (record) => {
    try {
      setUpdatingPlayerId(record.player.id)
      await setPlayerRosterActive({
        playerId: record.player.id,
        teamId: record.roster?.team_id || null,
        season: record.roster?.season || null,
        isActive: record.roster?.is_active === false,
      })
      await loadData()
    } catch (statusError) {
      setError(statusError.message || 'Unable to update player status.')
    } finally {
      setUpdatingPlayerId(null)
    }
  }


  const handlePreviewNbaStats = async () => {
    try {
      setNbaImportLoading(true)
      setError('')
      const rows = await previewNbaStatsUpdates({
        season: nbaImportSeason,
        records: teamRecords,
      })
      setNbaImportRows(rows)
    } catch (importError) {
      setError(importError.message || 'Unable to load NBA.com statistics.')
    } finally {
      setNbaImportLoading(false)
    }
  }

  const handleApplyNbaStats = async () => {
    try {
      setNbaImportApplying(true)
      setError('')
      const result = await applyNbaStatsUpdates({
        season: nbaImportSeason,
        previewRows: nbaImportRows,
      })
      await loadData()
      setNbaImportRows([])
      setShowNbaImport(false)
      window.alert(
        `Updated ${result.statsUpdated} stat rows, ${result.bioUpdated} player bios, ` +
        `and ${result.measurementsUpdated} measurement records.`,
      )
    } catch (importError) {
      setError(importError.message || 'Unable to apply NBA statistics.')
    } finally {
      setNbaImportApplying(false)
    }
  }

  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const selectedTeamName =
    selectedTeamId === 'unassigned'
      ? 'Unassigned Players'
      : selectedTeam
        ? `${selectedTeam.city} ${selectedTeam.name}`
        : 'Team'

  if (admin === undefined || loading && admin === undefined) {
    return <main className="admin-loading">Loading admin…</main>
  }

  if (!admin) {
    return <LoginPanel onSignedIn={async () => {
      const currentAdmin = await loadAdmin()
      if (currentAdmin) await loadData()
    }} />
  }

  if (selectedRecord || addingPlayer) {
    return (
      <div className="admin-page">
        <PlayerEditor
          record={selectedRecord}
          teams={teams}
          initialTeamId={selectedTeamId === 'unassigned' ? teams[0]?.id : selectedTeamId}
          onCancel={() => {
            setSelectedRecord(null)
            setAddingPlayer(false)
          }}
          onSaved={async () => {
            await loadData()
            setSelectedRecord(null)
            setAddingPlayer(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div>
          <span className="admin-kicker">District Basketball Lab</span>
          <h1>{selectedTeamName} Admin</h1>
        </div>

        <div className="admin-team-toolbar">
          <label>
            <span>Team</span>
            <select
              value={selectedTeamId}
              onChange={(event) => {
                const nextTeamId = event.target.value
                setSelectedTeamId(nextTeamId)
                setSelectedRecord(null)
                setAddingPlayer(false)
                setShowNbaImport(false)
                setNbaImportRows([])
                const nextRecord = records.find(
                  (record) => record.roster?.team_id === nextTeamId,
                )
                if (nextRecord?.roster?.season) {
                  setNbaImportSeason(nextRecord.roster.season)
                }
              }}
            >
              {teams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.city} {team.name}
                </option>
              ))}
              <option value="unassigned">Unassigned players</option>
            </select>
          </label>
        </div>

        <div className="admin-topbar-actions">
          <a href="/">Lineup Lab</a>
          <button
            type="button"
            onClick={async () => {
              await signOutAdmin()
              setAdmin(null)
            }}
          >
            Sign Out
          </button>
          <button
            type="button"
            className="admin-nba-import-button"
            onClick={() => {
              setShowNbaImport((current) => !current)
              setNbaImportRows([])
            }}
            disabled={selectedTeamId === 'unassigned'}
          >
            Import NBA Stats
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setAddingPlayer(true)}
          >
            + Add Player
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {showNbaImport && (
        <NbaImportPanel
          season={nbaImportSeason}
          onSeasonChange={(value) => {
            setNbaImportSeason(value)
            setNbaImportRows([])
          }}
          rows={nbaImportRows}
          loading={nbaImportLoading}
          applying={nbaImportApplying}
          onPreview={handlePreviewNbaStats}
          onApply={handleApplyNbaStats}
          onClose={() => {
            setShowNbaImport(false)
            setNbaImportRows([])
          }}
        />
      )}

      <section className="admin-summary-grid">
        <div><span>Team players</span><strong>{summary.total}</strong></div>
        <div><span>Complete</span><strong>{summary.complete}</strong></div>
        <div><span>Missing images</span><strong>{summary.missingImages}</strong></div>
        <div><span>Missing measurements</span><strong>{summary.missingMeasurements}</strong></div>
      </section>

      <section className="admin-audit-panel">
        <div className="admin-audit-controls">
          <input
            type="search"
            placeholder="Search players…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="incomplete">Needs attention</option>
            <option value="all">All players</option>
            <option value="complete">Complete</option>
            <option value="active">Active roster</option>
            <option value="inactive">Inactive roster</option>
            <option value="images">Missing images</option>
            <option value="measurements">Missing measurements</option>
            <option value="stats">Missing stats</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="completeness">Sort: Completeness</option>
            <option value="name">Sort: Player name</option>
            <option value="jersey">Sort: Jersey number</option>
            <option value="status">Sort: Roster status</option>
            <option value="missing">Sort: Missing fields</option>
          </select>

          <button
            type="button"
            className="admin-sort-direction"
            onClick={() =>
              setSortDirection((current) =>
                current === 'asc' ? 'desc' : 'asc',
              )
            }
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading player audit…</div>
        ) : (
          <div className="admin-player-table-wrap">
            <table className="admin-player-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => setSort('name')}>
                      Player{sortIndicator('name')}
                    </button>
                  </th>
                  <th>Roster</th>
                  <th>
                    <button type="button" onClick={() => setSort('completeness')}>
                      Completeness{sortIndicator('completeness')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => setSort('missing')}>
                      Missing{sortIndicator('missing')}
                    </button>
                  </th>
                  <th>Quick actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const image = resolvePlayerImageUrl({
                    imageUrlOverride: record.player.image_url_override,
                    nbaPlayerId: record.player.nba_player_id,
                    legacyImageUrl: record.player.image_url,
                  })

                  return (
                    <tr key={record.player.id}>
                      <td>
                        <div className="admin-player-cell">
                          <div className="admin-player-thumb">
                            {image ? <img src={image} alt="" /> : null}
                          </div>
                          <div>
                            <strong>{record.player.display_name}</strong>
                            <span>
                              {record.roster?.jersey_number
                                ? `#${record.roster.jersey_number} · `
                                : ''}
                              {record.roster?.roster_position ||
                                record.player.primary_position ||
                                'No position'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-roster-status-cell">
                          <span
                            className={
                              record.roster?.is_active === false
                                ? 'admin-status-badge admin-status-inactive'
                                : 'admin-status-badge admin-status-active'
                            }
                          >
                            {record.roster?.is_active === false
                              ? 'Inactive'
                              : 'Active'}
                          </span>
                          <small>
                            {record.roster?.roster_status || 'Unassigned'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-completeness">
                          <span>{record.audit.score}%</span>
                          <div>
                            <i style={{ width: `${record.audit.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-missing-tags">
                          {record.audit.complete ? (
                            <span className="admin-complete-tag">Complete</span>
                          ) : (
                            record.audit.missing.map((item) => (
                              <span key={item}>{item}</span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-quick-actions">
                          <button
                            type="button"
                            className="admin-edit-button"
                            onClick={() => setSelectedRecord(record)}
                          >
                            Edit
                          </button>
                          {record.roster && (
                            <button
                              type="button"
                              className={
                                record.roster.is_active === false
                                  ? 'admin-status-toggle admin-activate-button'
                                  : 'admin-status-toggle admin-deactivate-button'
                              }
                              disabled={updatingPlayerId === record.player.id}
                              onClick={() => handleQuickStatus(record)}
                            >
                              {updatingPlayerId === record.player.id
                                ? 'Saving…'
                                : record.roster.is_active === false
                                  ? 'Activate'
                                  : 'Deactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
