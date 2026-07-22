export const CURRENT_PROJECT_VERSION = 2.5

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

export const createEmptyStarters = () =>
  Object.fromEntries(POSITIONS.map((position) => [position, null]))

export const DEFAULT_LINEUP_NAMES = [
  'Starters',
  '2nd String',
  '3rd String',
  'Lineup 4',
  'Lineup 5',
  'Lineup 6',
]

export const createDefaultLineups = () =>
  DEFAULT_LINEUP_NAMES.map((name) => ({
    name,
    playerIds: [],
  }))

export const initialProjectState = {
  version: CURRENT_PROJECT_VERSION,
  activeTeamId: 'wizards',
  statMode: 'current',
  formation: '2-1-2',
  selectedPlayerId: null,
  analyticsTarget: {
    type: 'starters',
    index: null,
  },
  teams: {
    wizards: {
      id: 'wizards',
      name: 'Wizards',
      abbreviation: 'WAS',
      city: 'Washington',
      imgURL: 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg',
      primaryColor: '#002B5C',
      secondaryColor: '#E31837',
      accentColor: '#FFFFFF',
      surfaceColor: '#081523',
      glowColor: '#C8102E',
      players: [],
      lineup: {
        starters: createEmptyStarters(),
        secondUnit: Array(5).fill(null),
        thirdUnit: Array(5).fill(null),
      },
      savedLineups: createDefaultLineups(),
    },
    spurs: {
      id: 'spurs',
      name: 'Spurs',
      abbreviation: 'SAS',
      city: 'San Antonio',
      imgURL: 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg',
      primaryColor: '#000000',
      secondaryColor: '#C4CED4',
      accentColor: '#FFFFFF',
      surfaceColor: '#101214',
      glowColor: '#C4CED4',
      players: [],
      lineup: {
        starters: createEmptyStarters(),
        secondUnit: Array(5).fill(null),
        thirdUnit: Array(5).fill(null),
      },
      savedLineups: createDefaultLineups(),
    },
  },
}
