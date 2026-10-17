import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// The partner's own session — there is no service key in this app. On the
// web, AsyncStorage is localStorage.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'gf-partner-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
