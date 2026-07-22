import { localPlayerProvider } from './playerData/localPlayerProvider'
import { supabasePlayerProvider } from './playerData/supabasePlayerProvider'

const providers = {
  local: localPlayerProvider,
  supabase: supabasePlayerProvider,
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

const withLocalFallback = async (methodName, ...args) => {
  const provider = getProvider()

  try {
    const result = await provider[methodName](...args)

    if (
      configuredProvider !== 'local' &&
      Array.isArray(result) &&
      result.length === 0
    ) {
      console.warn(
        `${configuredProvider} returned no player data; using local fallback.`,
      )
      return localPlayerProvider[methodName](...args)
    }

    return result
  } catch (error) {
    if (configuredProvider === 'local') throw error

    console.warn(
      `Unable to load player data from ${configuredProvider}; using local fallback.`,
      error,
    )

    return localPlayerProvider[methodName](...args)
  }
}

export const getPlayers = () => withLocalFallback('getPlayers')

export const getPlayerById = (playerId) =>
  withLocalFallback('getPlayerById', playerId)

export const getTeamRoster = (team) =>
  withLocalFallback('getTeamRoster', team)

export const getPlayerDataProviderName = () => configuredProvider
