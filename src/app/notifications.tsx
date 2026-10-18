import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Bell, ChevronRight } from 'lucide-react-native'
import { api, type PartnerNotification } from '@/lib/api'
import { clock } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { useBell } from '@/lib/notifications'
import { C } from '@/lib/ui'
import { Header } from '@/components/Header'
import { RequirePartner } from '@/components/RequirePartner'

export default function NotificationsRoute() {
  return <RequirePartner>{() => <Notifications />}</RequirePartner>
}

// Everything the office and the app have sent this partner (the same texts as
// the pushes, in the language they were sent in). Opening the list marks it read.
function Notifications() {
  const { t, error: tError, locale } = useT()
  const bell = useBell()
  const [items, setItems] = useState<PartnerNotification[] | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.notifications(100)
      setItems(r.items)
      setError('')
      if (r.unread > 0) {
        await api.notificationsRead()
        bell.clear()
      }
    } catch (e) {
      setError(tError(e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tError])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function back() {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title={t('notifications')} onBack={back} onRefresh={refresh} refreshing={refreshing} />
      <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {items && items.length === 0 ? (
          <View style={s.empty}>
            <Bell size={28} color={C.faint} />
            <Text style={s.emptyText}>{t('noNotifications')}</Text>
          </View>
        ) : null}
        {(items ?? []).map((n) => {
          const opens = !!n.data?.batch_id
          return (
            <Pressable
              key={n.id}
              disabled={!opens}
              onPress={() => router.push(`/batch/${n.data.batch_id}`)}
              style={({ pressed }) => [s.item, !n.read && s.unread, pressed && { opacity: 0.85 }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.title}>{n.title}</Text>
                <Text style={s.body}>{n.body}</Text>
                <Text style={s.when}>{new Date(n.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} · {clock(n.created_at)}</Text>
              </View>
              {opens ? <ChevronRight size={18} color={C.faint} /> : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40, gap: 10 },
  error: { fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderRadius: 12, padding: 12, overflow: 'hidden' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText: { fontSize: 15, color: C.muted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  unread: { borderColor: C.green, backgroundColor: C.greenSoft },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  body: { fontSize: 14, color: '#374151', marginTop: 3, lineHeight: 19 },
  when: { fontSize: 12, color: C.muted, marginTop: 6 },
})
