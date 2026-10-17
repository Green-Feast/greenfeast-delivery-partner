import { useCallback, useState } from 'react'
import { AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { AlertTriangle, Banknote, CheckCircle2, ChevronRight, Clock } from 'lucide-react-native'
import { api, type DayStats, type Me, type PartnerBatch, type Slot } from '@/lib/api'
import { addDays, dayLabel, rupees, RUN_LABEL, SLOT_HOURS } from '@/lib/format'
import { useSession } from '@/lib/session'
import { C, confirm } from '@/lib/ui'
import { Header } from '@/components/Header'
import { RequirePartner } from '@/components/RequirePartner'

export default function TodayRoute() {
  return <RequirePartner>{(me) => <Today me={me} />}</RequirePartner>
}

function Today({ me }: { me: Me }) {
  const { signOut, reload } = useSession()
  const [batches, setBatches] = useState<PartnerBatch[] | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const today = me.today
  const tomorrow = addDays(today, 1)

  const load = useCallback(async () => {
    try {
      setBatches(await api.batches([today, tomorrow]))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your batches.')
    }
  }, [today, tomorrow])

  // Fresh whenever the screen is open: on arrival and every minute.
  useFocusEffect(
    useCallback(() => {
      load()
      reload()
      const id = setInterval(() => {
        if (AppState.currentState === 'active') load()
      }, 60_000)
      return () => clearInterval(id)
    }, [load, reload])
  )

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function handleSignOut() {
    if (await confirm('Sign out?', 'You can sign in again with your phone number and password.', 'Sign out')) signOut()
  }

  const bySlot = (slot: Slot) => (batches ?? []).filter((b) => b.slot === slot)
  const tomorrowRows = (batches ?? []).filter((b) => (b.days[tomorrow]?.stops ?? 0) > 0)

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={`Hi ${me.name.trim().split(/\s+/)[0]}`}
        subtitle={`${dayLabel(today)}${me.is_test ? ' · TEST' : ''}`}
        onRefresh={refresh}
        refreshing={refreshing}
        onSignOut={handleSignOut}
      />
      <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {error ? <Text style={s.error}>{error}</Text> : null}

        {batches && batches.length === 0 ? (
          <Text style={s.empty}>No batches are assigned to you yet. Ask the office to add you to a batch.</Text>
        ) : null}

        {(['lunch', 'dinner'] as const).map((slot) =>
          bySlot(slot).length === 0 ? null : (
            <View key={slot} style={s.section}>
              <View style={s.sectionHead}>
                <Clock size={15} color={C.muted} />
                <Text style={s.sectionTitle}>{slot === 'lunch' ? 'LUNCH' : 'DINNER'} · {SLOT_HOURS[slot]}</Text>
              </View>
              {bySlot(slot).map((b) => (
                <BatchCard key={b.id} batch={b} day={b.days[today]} onPress={() => router.push(`/batch/${b.id}`)} />
              ))}
            </View>
          )
        )}

        {tomorrowRows.length > 0 ? (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { marginBottom: 8 }]}>TOMORROW · {dayLabel(tomorrow).toUpperCase()}</Text>
            <View style={s.tomorrow}>
              {tomorrowRows.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() => router.push(`/batch/${b.id}?date=${tomorrow}`)}
                  style={[s.tomorrowRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
                >
                  <Text style={s.tomorrowName}>
                    {b.name.trim()} <Text style={{ color: C.muted, fontWeight: '400' }}>· {b.slot === 'lunch' ? 'Lunch' : 'Dinner'}</Text>
                  </Text>
                  <View style={s.rowEnd}>
                    <Text style={{ color: C.muted }}>{b.days[tomorrow].stops} stop{b.days[tomorrow].stops === 1 ? '' : 's'}</Text>
                    <ChevronRight size={16} color={C.muted} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

function BatchCard({ batch, day, onPress }: { batch: PartnerBatch; day: DayStats | undefined; onPress: () => void }) {
  const d = day ?? { stops: 0, meals: 0, done: 0, issues: 0, cash: 0 }
  const allDone = d.stops > 0 && d.done === d.stops
  const meta = [batch.area?.trim(), batch.time_window ? RUN_LABEL[batch.time_window] ?? batch.time_window : null, batch.role === 'secondary' ? 'Backup' : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={s.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{batch.name.trim()}</Text>
          <Text style={s.cardMeta}>{meta || '—'}</Text>
        </View>
        <ChevronRight size={20} color={C.faint} />
      </View>
      {d.stops === 0 ? (
        <Text style={[s.cardMeta, { marginTop: 10 }]}>No deliveries today.</Text>
      ) : (
        <>
          <View style={s.progressRow}>
            <Text style={s.progressText}>{d.stops} stop{d.stops === 1 ? '' : 's'} · {d.meals} meal{d.meals === 1 ? '' : 's'}</Text>
            <View style={s.rowEnd}>
              {allDone ? <CheckCircle2 size={16} color={C.green} /> : null}
              <Text style={allDone ? s.doneText : { color: C.muted }}>{d.done}/{d.stops} done</Text>
            </View>
          </View>
          <View style={s.bar}><View style={[s.barFill, { width: `${Math.round((d.done / d.stops) * 100)}%` }]} /></View>
          {d.issues > 0 || d.cash > 0 ? (
            <View style={s.chips}>
              {d.issues > 0 ? (
                <View style={[s.chip, { backgroundColor: C.redSoft }]}>
                  <AlertTriangle size={13} color={C.redDark} />
                  <Text style={[s.chipText, { color: C.redDark }]}>{d.issues} problem{d.issues === 1 ? '' : 's'}</Text>
                </View>
              ) : null}
              {d.cash > 0 ? (
                <View style={[s.chip, { backgroundColor: C.amberSoft }]}>
                  <Banknote size={13} color={C.amber} />
                  <Text style={[s.chipText, { color: C.amber }]}>Collect {rupees(d.cash)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40, gap: 4 },
  error: { fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderRadius: 12, padding: 12, marginBottom: 8, overflow: 'hidden' },
  empty: { marginTop: 16, padding: 24, textAlign: 'center', color: C.muted, fontSize: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, overflow: 'hidden' },
  section: { marginTop: 12, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  cardMeta: { fontSize: 13, color: C.muted, marginTop: 2 },
  progressRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 14, fontWeight: '600', color: C.text },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { color: C.green, fontWeight: '700' },
  bar: { marginTop: 8, height: 8, borderRadius: 4, backgroundColor: C.grey, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  chips: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },
  tomorrow: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  tomorrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  tomorrowName: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
})
