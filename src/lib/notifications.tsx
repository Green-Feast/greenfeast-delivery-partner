import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { router } from 'expo-router'
import { api } from './api'
import { useSession } from './session'
import { storedLang, useT } from './i18n'
import { onNotificationReceived, onNotificationTap, registerPush } from './push'

// The bell's unread count, shared by every screen.
type Bell = { unread: number; refresh: () => Promise<void>; clear: () => void }
const BellContext = createContext<Bell | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status, me } = useSession()
  const { setLang } = useT()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (status !== 'signed_in') return
    try {
      setUnread((await api.notifications(1)).unread)
    } catch {
      // offline — keep the last count
    }
  }, [status])

  // Signed in: push token, language, first count.
  useEffect(() => {
    if (status !== 'signed_in' || !me) {
      setUnread(0)
      return
    }
    registerPush()
    refresh()
    // The phone's own choice wins; a fresh install takes the account's.
    storedLang().then((local) => {
      if (!local) setLang(me.language)
      else if (local !== me.language) api.setLanguage(local).catch(() => {})
    })
    // me.id only: don't redo this every time me is reloaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, me?.id])

  // Tapping a push opens its batch; a push while open refreshes the bell.
  useEffect(() => {
    const offTap = onNotificationTap((batchId) => router.push(batchId ? `/batch/${batchId}` : '/notifications'))
    const offReceived = onNotificationReceived(() => refresh())
    const appState = AppState.addEventListener('change', (s) => { if (s === 'active') refresh() })
    return () => {
      offTap()
      offReceived()
      appState.remove()
    }
  }, [refresh])

  const value = useMemo(() => ({ unread, refresh, clear: () => setUnread(0) }), [unread, refresh])
  return <BellContext.Provider value={value}>{children}</BellContext.Provider>
}

export function useBell() {
  const b = useContext(BellContext)
  if (!b) throw new Error('useBell outside NotificationsProvider')
  return b
}
