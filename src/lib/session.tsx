import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppState, Platform } from 'react-native'
import { supabase } from './supabase'
import { api, type Me } from './api'
import { loginEmail } from './config'
import type { Key } from './i18n'
import { unregisterPush } from './push'

// Who's signed in. A session alone isn't enough: partner_me() has to find an
// active delivery partner behind it (the admin can switch a login off).

type Status = 'loading' | 'signed_out' | 'signed_in' | 'offline'

type Session = {
  status: Status
  me: Me | null
  // null on success, otherwise the message to show (an i18n key)
  signIn: (phone: string, password: string) => Promise<Key | null>
  signOut: () => Promise<void>
  reload: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [me, setMe] = useState<Me | null>(null)

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setMe(null)
      setStatus('signed_out')
      return
    }
    try {
      const m = await api.me()
      if (!m) {
        // Login switched off or removed by the office.
        await supabase.auth.signOut()
        setMe(null)
        setStatus('signed_out')
        return
      }
      setMe(m)
      setStatus('signed_in')
    } catch {
      setStatus((s) => (s === 'signed_in' ? s : 'offline'))
    }
  }, [])

  useEffect(() => {
    reload()
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setMe(null)
        setStatus('signed_out')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [reload])

  // On phones, refresh the session only while the app is open (Supabase's
  // advice for React Native).
  useEffect(() => {
    if (Platform.OS === 'web') return
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') supabase.auth.startAutoRefresh()
      else supabase.auth.stopAutoRefresh()
    })
    return () => sub.remove()
  }, [])

  const signIn = useCallback(async (phone: string, password: string) => {
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (digits.length !== 10 || !password) return 'errEnterPhonePw'
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(digits), password })
    if (error) {
      return /fetch|network/i.test(error.message) ? 'errNoInternet' : 'errWrongLogin'
    }
    const m = await api.me().catch(() => null)
    if (!m) {
      await supabase.auth.signOut()
      return 'errLoginOff'
    }
    setMe(m)
    setStatus('signed_in')
    return null
  }, [])

  const signOut = useCallback(async () => {
    // This phone stops getting this partner's pushes.
    await unregisterPush()
    await supabase.auth.signOut({ scope: 'local' })
    setMe(null)
    setStatus('signed_out')
  }, [])

  const value = useMemo(() => ({ status, me, signIn, signOut, reload }), [status, me, signIn, signOut, reload])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const s = useContext(SessionContext)
  if (!s) throw new Error('useSession outside SessionProvider')
  return s
}
