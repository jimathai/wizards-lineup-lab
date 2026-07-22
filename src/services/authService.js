import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'

export const ensureAnonymousSession = async () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.')
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (session?.user) return session.user

  const { data, error } = await supabase.auth.signInAnonymously()

  if (error) throw error
  if (!data.user) {
    throw new Error('Supabase did not return an anonymous user.')
  }

  return data.user
}
