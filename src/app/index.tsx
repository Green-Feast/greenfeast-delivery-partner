import { useCallback, useState } from 'react'
import { AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { AlertTriangle, Banknote, CheckCircle2, ChevronRight, Clock } from 'lucide-react-native'
import { api, type DayStats, type Me, type PartnerBatch, type Slot } from '@/lib/api'
import { addDays, dayLabel, rupees, SLOT_HOURS } from '@/lib/format'
import { useSession } from '@/lib/session'
import { useT, type Key } from '@/lib/i18n'
import { useBell } from '@/lib/notifications'
import { C } from '@/lib/ui'
import { Header } from '@/components/Header'
import { RequirePartner } from '@/components/RequirePartner'
import { MenuSheet } from '@/components/MenuSheet'

export default function TodayRoute() {
  return <RequirePartner>{(me) => <Today me={me} />}</RequirePartner>
}

function Today({ me }: { me: Me }) {
  const { reload } = useSession()
  const { t, error: tError, locale } = useT()
  const bell = useBell()
  const [batches, setBatches] = useState<PartnerBatch[] | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [menu, setMenu] = useState(false)
  const today = me.today
  const tomorrow = addDays(today, 1)

  const load = useCallback(async () => {
    try {
      setBatches(await api.batches([today, tomorrow]))
      setError('')
    } catch (e) {
      setError(tError(e) || t('loadBatchesFail'))
    }
  }, [today, tomorrow, t, tError])

  // Fresh whenever the screen is open: on arrival and every minute.
  useFocusEffect(
    useCallback(() => {
      load()
      reload()
      bell.refresh()
      const id = setInterval(() => {
        if (AppState.currentState === 'active') {
          load()
          bell.refresh()
        }
      }, 60_000)
      return () => clearInterval(id)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, reload, bell.refresh])
  )

  async function refresh() {
    setRefreshing(true)
    await Promise.all([load(), bell.refresh()])
    setRefreshing(false)
  }

  const bySlot = (slot: Slot) => (batches ?? []).filter((b) => b.slot === slot)
  const tomorrowRows = (batches ?? []).filter((b) => (b.days[tomorrow]?.stops ?? 0) > 0)

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={t('hi', { name: me.name.trim().split(/\s+/)[0] })}
        subtitle={`${dayLabel(today, locale)}${me.is_test ? ' · TEST' : ''}`}
        onRefresh={refresh}
        refreshing={refreshing}
        onBell={() => router.push('/notifications')}
        unread={bell.unread}
        onMenu={() => setMenu(true)}
      />
      <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {error ? <Text style={s.error}>{error}</Text> : null}

        {batches && batches.length === 0 ? <Text style={s.empty}>{t('noBatches')}</Text> : null}

        {(['lunch', 'dinner'] as const).map((slot) =>
          bySlot(slot).length === 0 ? null : (
            <View key={slot} style={s.section}>
              <View style={s.sectionHead}>
                <Clock size={15} color={C.muted} />
                <Text style={s.sectionTitle}>{t(slot)} · {SLOT_HOURS[slot]}</Text>
              </View>
              {bySlot(slot).map((b) => (
                <BatchCard key={b.id} batch={b} day={b.days[today]} onPress={() => router.push(`/batch/${b.id}`)} />
              ))}
            </View>
          )
        )}

        {tomorrowRows.length > 0 ? (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { marginBottom: 8 }]}>{t('tomorrow')} · {dayLabel(tomorrow, locale)}</Text>
            <View style={s.tomorrow}>
              {tomorrowRows.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() => router.push(`/batch/${b.id}?date=${tomorrow}`)}
                  style={[s.tomorrowRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
                >
                  <Text style={s.tomorrowName}>
                    {b.name.trim()} <Text style={{ color: C.muted, fontWeight: '400' }}>· {t(b.slot)}</Text>
                  </Text>
                  <View style={s.rowEnd}>
                    <Text style={{ color: C.muted }}>{b.days[tomorrow].stops === 1 ? t('stop1') : t('stopN', { n: b.days[tomorrow].stops })}</Text>
                    <ChevronRight size={16} color={C.muted} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
      {menu ? <MenuSheet onClose={() => setMenu(false)} /> : null}
    </View>
  )
}

function BatchCard({ batch, day, onPress }: { batch: PartnerBatch; day: DayStats | undefined; onPress: () => void }) {
  const { t, count } = useT()
  const d = day ?? { stops: 0, meals: 0, done: 0, issues: 0, cash: 0 }
  const allDone = d.stops > 0 && d.done === d.stops
  const run = batch.time_window ? (`run_${batch.time_window}` as Key) : null
  const meta = [batch.area?.trim(), run ? t(run) : null, batch.role === 'secondary' ? t('backup') : null].filter(Boolean).join(' · ')
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
        <Text style={[s.cardMeta, { marginTop: 10 }]}>{t('noDeliveriesToday')}</Text>
      ) : (
        <>
          <View style={s.progressRow}>
            <Text style={s.progressText}>{count('stop1', 'stopN', d.stops)} · {count('meal1', 'mealN', d.meals)}</Text>
            <View style={s.rowEnd}>
              {allDone ? <CheckCircle2 size={16} color={C.green} /> : null}
              <Text style={allDone ? s.doneText : { color: C.muted }}>{t('done', { done: d.done, total: d.stops })}</Text>
            </View>
          </View>
          <View style={s.bar}><View style={[s.barFill, { width: `${Math.round((d.done / d.stops) * 100)}%` }]} /></View>
          {d.issues > 0 || d.cash > 0 ? (
            <View style={s.chips}>
              {d.issues > 0 ? (
                <View style={[s.chip, { backgroundColor: C.redSoft }]}>
                  <AlertTriangle size={13} color={C.redDark} />
                  <Text style={[s.chipText, { color: C.redDark }]}>{count('problem1', 'problemN', d.issues)}</Text>
                </View>
              ) : null}
              {d.cash > 0 ? (
                <View style={[s.chip, { backgroundColor: C.amberSoft }]}>
                  <Banknote size={13} color={C.amber} />
                  <Text style={[s.chipText, { color: C.amber }]}>{t('collect', { amount: rupees(d.cash) })}</Text>
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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 0.3 },
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
