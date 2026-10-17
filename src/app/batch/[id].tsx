import { useCallback, useMemo, useRef, useState } from 'react'
import { AppState, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import * as Location from 'expo-location'
import { Banknote, List, LocateFixed, Map as MapIcon, Route, Truck } from 'lucide-react-native'
import { api, NOT_STARTED, stopState, type BatchDay, type Me, type Stop } from '@/lib/api'
import { dayLabel, rupees, RUN_LABEL, SLOT_HOURS } from '@/lib/format'
import { nearestFirst, routeUrl } from '@/lib/maps'
import { C, confirm } from '@/lib/ui'
import { Header } from '@/components/Header'
import { RequirePartner } from '@/components/RequirePartner'
import { Button } from '@/components/Button'
import { DoneRow, StopCard } from '@/components/StopCard'
import { CashSheet, DeliverSheet, ProblemSheet } from '@/components/StopSheets'
import { Toast, useToast } from '@/components/Toast'
import RouteMap from '@/components/RouteMap'
import type { MapData } from '@/components/mapHtml'

export default function BatchRoute() {
  return <RequirePartner>{(me) => <Batch me={me} />}</RequirePartner>
}

type SheetState = { kind: 'deliver' | 'problem' | 'cash'; stop: Stop } | null

function isDone(s: Stop) {
  const state = stopState(s.items)
  return state === 'delivered' || state === 'closed'
}

function Batch({ me }: { me: Me }) {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>()
  const [data, setData] = useState<BatchDay | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  // The partner's own reordering, shown at once (saved in the background).
  const [order, setOrder] = useState<string[] | null>(null)
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [starting, setStarting] = useState(false)
  const [sheet, setSheet] = useState<SheetState>(null)
  const { toast, show } = useToast()
  const scroll = useRef<ScrollView>(null)
  const positions = useRef<Record<string, number>>({})

  const load = useCallback(async () => {
    try {
      setData(await api.batchStops(String(id), date ? String(date) : me.today))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the stops.')
    }
  }, [id, date, me.today])

  useFocusEffect(
    useCallback(() => {
      load()
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') load()
      }, 60_000)
      return () => clearInterval(timer)
    }, [load])
  )

  const stops = useMemo(() => data?.stops ?? [], [data])
  const sorted = useMemo(() => {
    if (!order) return stops
    const rank = new Map(order.map((k, i) => [k, i]))
    return [...stops].sort((a, b) => (rank.get(a.key) ?? 1e6) - (rank.get(b.key) ?? 1e6))
  }, [stops, order])
  const pending = sorted.filter((s) => !isDone(s))
  const done = sorted.filter(isDone)
  const notStarted = stops.reduce((n, s) => n + s.items.filter((i) => NOT_STARTED.includes(i.status)).length, 0)
  const cashToCollect = pending.reduce((n, s) => n + (s.codDue > 0 && !s.cashReport ? s.codDue : 0), 0)
  const canAct = !!data && data.date === data.today

  const mapData: MapData = useMemo(() => {
    const open = sorted.filter((s) => !isDone(s))
    return {
      stops: sorted
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({
          key: s.key,
          n: open.indexOf(s) + 1,
          lat: s.lat!,
          lng: s.lng!,
          name: s.name,
          done: isDone(s),
          issue: stopState(s.items) === 'issue',
        })),
      me: here,
    }
  }, [sorted, here])

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function back() {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  function saveOrder(keys: string[]) {
    setOrder(keys)
    const addressIds = keys.map((k) => stops.find((s) => s.key === k)?.addressId).filter((x): x is string => !!x)
    api.saveRoute(String(id), addressIds).catch((e) => show(false, e instanceof Error ? e.message : 'Could not save the order.'))
  }

  function move(key: string, dir: -1 | 1) {
    const keys = pending.map((s) => s.key)
    const i = keys.indexOf(key)
    const j = i + dir
    if (i < 0 || j < 0 || j >= keys.length) return
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
    saveOrder([...keys, ...done.map((s) => s.key)])
  }

  async function sortByDistance() {
    setLocating(true)
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (!perm.granted) {
        show(false, 'Allow location for GreenFeast Partner to sort by distance.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const from = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setHere(from)
      const route = nearestFirst(pending, from)
      const noPin = pending.filter((s) => s.lat == null || s.lng == null).length
      saveOrder([...route, ...done].map((s) => s.key))
      show(true, noPin > 0 ? `Sorted — ${noPin} stop${noPin === 1 ? ' has' : 's have'} no pin and went last.` : 'Sorted by distance from you.')
    } catch {
      show(false, "Couldn't get your location — try again outside.")
    } finally {
      setLocating(false)
    }
  }

  async function startDelivery() {
    const ok = await confirm(
      'Start delivery?',
      `${notStarted} meal${notStarted === 1 ? '' : 's'} will show "on the way" and the customers get a message.`,
      'Start'
    )
    if (!ok) return
    setStarting(true)
    try {
      const r = await api.startDelivery(String(id))
      show(true, r.moved > 0 ? `${r.moved} meal${r.moved === 1 ? '' : 's'} on the way — customers have been told.` : 'Everything here is already on the way.')
      await load()
    } catch (e) {
      show(false, e instanceof Error ? e.message : 'Could not start the delivery.')
    } finally {
      setStarting(false)
    }
  }

  function pick(key: string) {
    setView('list')
    setTimeout(() => {
      const y = positions.current[key]
      if (y != null) scroll.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true })
    }, 80)
  }

  if (data === null) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Batch not found" onBack={back} />
        <Text style={s.empty}>This batch isn&apos;t assigned to you any more.</Text>
      </View>
    )
  }

  const b = data?.batch
  const subtitle = b
    ? [
        data!.date === data!.today ? 'Today' : dayLabel(data!.date),
        `${b.slot === 'lunch' ? 'Lunch' : 'Dinner'} ${SLOT_HOURS[b.slot]}`,
        b.time_window ? RUN_LABEL[b.time_window] ?? b.time_window : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <View style={{ flex: 1 }}>
      <Header title={b?.name.trim() ?? 'Loading…'} subtitle={subtitle} onBack={back} onRefresh={refresh} refreshing={refreshing} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {error ? <Text style={s.error}>{error}</Text> : null}

        {data ? (
          <>
            <View style={s.progressRow}>
              <Text style={s.progressText}>{done.length}/{stops.length} stop{stops.length === 1 ? '' : 's'} done</Text>
              {cashToCollect > 0 ? (
                <View style={s.cashChip}>
                  <Banknote size={14} color={C.amber} />
                  <Text style={s.cashChipText}>Collect {rupees(cashToCollect)}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${stops.length ? Math.round((done.length / stops.length) * 100) : 0}%` }]} />
            </View>

            {!canAct ? (
              <Text style={s.viewOnly}>Looking at {dayLabel(data.date)} — you can mark deliveries only on the day.</Text>
            ) : null}

            {canAct && notStarted > 0 ? (
              <Button
                label={`Start delivery (${notStarted} meal${notStarted === 1 ? '' : 's'})`}
                onPress={startDelivery}
                busy={starting}
                big
                icon={<Truck size={20} color="#fff" />}
                style={{ marginTop: 16 }}
              />
            ) : null}

            {stops.length > 0 ? (
              <View style={s.tools}>
                <View style={s.toggle}>
                  {([['list', List, 'List'], ['map', MapIcon, 'Map']] as const).map(([v, Icon, label]) => (
                    <Pressable key={v} onPress={() => setView(v)} style={[s.toggleBtn, view === v && s.toggleOn]}>
                      <Icon size={16} color={view === v ? '#fff' : C.muted} />
                      <Text style={[s.toggleText, view === v && { color: '#fff' }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                {pending.length > 0 ? (
                  <Button
                    label="Nearest"
                    kind="outline"
                    onPress={sortByDistance}
                    busy={locating}
                    icon={<LocateFixed size={16} color={C.green} />}
                  />
                ) : null}
              </View>
            ) : null}

            {pending.length > 0 ? (
              <Button
                label={`Open route in Google Maps${pending.length > 10 ? ' (next 10 stops)' : ''}`}
                kind="outline"
                onPress={() => Linking.openURL(routeUrl(pending)).catch(() => {})}
                icon={<Route size={16} color={C.green} />}
                style={{ marginTop: 8 }}
              />
            ) : null}

            {stops.length === 0 ? (
              <Text style={s.empty}>No deliveries in this batch {data.date === data.today ? 'today' : `on ${dayLabel(data.date)}`}.</Text>
            ) : null}

            {view === 'map' && stops.length > 0 ? (
              <View style={s.mapWrap}>
                <RouteMap data={mapData} onPick={pick} />
                {stops.length > mapData.stops.length ? (
                  <Text style={s.mapNote}>
                    {stops.length - mapData.stops.length} stop{stops.length - mapData.stops.length === 1 ? ' has' : 's have'} no map pin — see the list.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {view === 'list' ? (
              <View style={s.list}>
                {pending.map((stop, i) => (
                  <View key={stop.key} onLayout={(e) => { positions.current[stop.key] = e.nativeEvent.layout.y }}>
                    <StopCard
                      stop={stop}
                      n={i + 1}
                      canAct={canAct}
                      first={i === 0}
                      last={i === pending.length - 1}
                      onMove={(dir) => move(stop.key, dir)}
                      onSheet={(kind) => setSheet({ kind, stop })}
                    />
                  </View>
                ))}
                {done.length > 0 ? <Text style={s.doneHead}>DONE</Text> : null}
                {done.map((stop) => (
                  <View key={stop.key} onLayout={(e) => { positions.current[stop.key] = e.nativeEvent.layout.y }}>
                    <DoneRow stop={stop} canAct={canAct} onCash={() => setSheet({ kind: 'cash', stop })} />
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {sheet?.kind === 'deliver' && data ? (
        <DeliverSheet stop={sheet.stop} today={data.today} onClose={() => setSheet(null)} onDone={(ok, text) => { show(ok, text); load() }} />
      ) : null}
      {sheet?.kind === 'problem' ? (
        <ProblemSheet stop={sheet.stop} onClose={() => setSheet(null)} onDone={(ok, text) => { show(ok, text); load() }} />
      ) : null}
      {sheet?.kind === 'cash' ? (
        <CashSheet stop={sheet.stop} onClose={() => setSheet(null)} onDone={(ok, text) => { show(ok, text); load() }} />
      ) : null}

      <Toast toast={toast} />
    </View>
  )
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 120 },
  error: { fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderRadius: 12, padding: 12, marginBottom: 10, overflow: 'hidden' },
  empty: { margin: 16, padding: 24, textAlign: 'center', color: C.muted, fontSize: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, overflow: 'hidden' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 14, fontWeight: '700', color: C.text },
  cashChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.amberSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  cashChipText: { fontSize: 12, fontWeight: '700', color: C.amber },
  bar: { marginTop: 8, height: 8, borderRadius: 4, backgroundColor: C.grey, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  viewOnly: { marginTop: 12, fontSize: 14, color: '#4B5563', backgroundColor: C.grey, borderRadius: 12, padding: 12, overflow: 'hidden' },
  tools: { marginTop: 16, flexDirection: 'row', gap: 8 },
  toggle: { flex: 1, flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', overflow: 'hidden' },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  toggleOn: { backgroundColor: C.green },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.muted },
  mapWrap: { marginTop: 14, marginHorizontal: -16 },
  mapNote: { paddingHorizontal: 16, paddingTop: 8, fontSize: 12, color: C.muted },
  list: { marginTop: 14, gap: 12 },
  doneHead: { marginTop: 8, fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
})
