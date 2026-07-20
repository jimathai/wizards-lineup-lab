import { localPlayerProvider } from './playerData/localPlayerProvider'

const providers = {
  local: localPlayerProvider,
}

const configuredProvider =
  import.meta.env.VITE_PLAYER_DATA_PROVIDER?.trim().toLowerCase() ||
  'local'

const getProvider = () => {
  const provider = providers[configuredProvider]

  if (!provider) {
    throw new Error(
      `Unknown player data provider: ${configuredProvider}. ` +
        `Available providers: ${Object.keys(providers).join(', ')}.`,
    )
  }

  return provider
}

export const getPlayers = () => getProvider().getPlayers()

export const getPlayerById = (playerId) =>
  getProvider().getPlayerById(playerId)

export const getTeamRoster = (team) =>
  getProvider().getTeamRoster(team)

export const getPlayerDataProviderName = () => configuredProvider
