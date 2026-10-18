import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  AlertTriangle, Banknote, CheckCircle2, ChevronDown, ChevronUp, Clock, MessageCircle, Navigation, Phone,
} from 'lucide-react-native'
import { OPEN, type Stop } from '@/lib/api'
import { clock, digits10, rupees } from '@/lib/format'
import { navigateUrl } from '@/lib/maps'
import { C } from '@/lib/ui'
import { useT } from '@/lib/i18n'
import { Button } from './Button'

function open(url: string) {
  Linking.openURL(url).catch(() => {})
}

export function StopCard({
  stop: s,
  n,
  canAct,
  first,
  last,
  onMove,
  onSheet,
}: {
  stop: Stop
  n: number
  canAct: boolean
  first: boolean
  last: boolean
  onMove: (dir: -1 | 1) => void
  onSheet: (kind: 'deliver' | 'problem' | 'cash') => void
}) {
  const { t, issue: tIssue } = useT()
  const phone = digits10(s.phone)
  const openItems = s.items.filter((i) => OPEN.includes(i.status))
  const issue = openItems.find((i) => i.issue)?.issue
  const onTheWay = openItems.some((i) => i.status === 'out_for_delivery')

  return (
    <View style={[st.card, issue ? { borderColor: C.redBorder } : null]}>
      <View style={st.top}>
        <View style={st.side}>
          <View style={st.badge}><Text style={st.badgeText}>{n}</Text></View>
          <Pressable onPress={() => onMove(-1)} disabled={first} hitSlop={6} style={[st.arrow, first && st.faded]} accessibilityLabel={t('moveUp')}>
            <ChevronUp size={20} color={C.faint} />
          </Pressable>
          <Pressable onPress={() => onMove(1)} disabled={last} hitSlop={6} style={[st.arrow, last && st.faded]} accessibilityLabel={t('moveDown')}>
            <ChevronDown size={20} color={C.faint} />
          </Pressable>
        </View>

        <View style={st.body}>
          <View style={st.nameRow}>
            <Text style={st.name}>{s.name}</Text>
            <Text style={st.label}>{s.label}</Text>
          </View>
          <Text style={st.address}>{s.address}</Text>
          {(s.timing || s.pincode) ? (
            <View style={st.metaRow}>
              {s.timing ? <Clock size={13} color={C.muted} /> : null}
              <Text style={st.meta}>{[s.timing, s.pincode].filter(Boolean).join(' · ')}</Text>
            </View>
          ) : null}

          <View style={st.items}>
            {s.items.map((it) => {
              const done = !OPEN.includes(it.status)
              return (
                <Text key={it.orderId} style={[st.item, done && st.itemDone]}>
                  {it.extra ? '+ ' : '• '}
                  <Text style={st.bold}>{it.meal}</Text>
                  {it.qty > 1 ? <Text style={st.qty}> ×{it.qty}</Text> : null}
                  {it.addons.length > 0 ? <Text style={st.addons}> · {it.addons.join(', ')}</Text> : null}
                </Text>
              )
            })}
          </View>

          {s.note ? <Text style={st.note}>{t('note', { note: s.note })}</Text> : null}
          {onTheWay && !issue ? <Text style={st.onTheWay}>{t('onTheWay')}</Text> : null}
          {issue ? (
            <View style={st.issue}>
              <AlertTriangle size={14} color={C.redDark} />
              <Text style={st.issueText}>{t('reported', { issue: tIssue(issue) })}</Text>
            </View>
          ) : null}

          {s.codDue > 0 ? (
            <View style={st.cash}>
              <View style={st.cashLeft}>
                <Banknote size={16} color={C.amber} />
                <Text style={st.cashText}>{s.cashReport ? t('cashReported', { amount: rupees(s.cashReport.amount) }) : t('collectCash', { amount: rupees(s.codDue) })}</Text>
              </View>
              {canAct ? (
                <Pressable onPress={() => onSheet('cash')} style={st.cashBtn}>
                  <Text style={st.cashBtnText}>{s.cashReport ? t('change') : t('cashCollected')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      <View style={st.links}>
        <Pressable style={st.link} onPress={() => open(navigateUrl(s))}>
          <Navigation size={16} color={C.green} />
          <Text style={[st.linkText, { color: C.green }]}>{t('go')}</Text>
        </Pressable>
        <Pressable style={[st.link, st.linkMid]} onPress={() => phone.length === 10 && open(`tel:+91${phone}`)} disabled={phone.length !== 10}>
          <Phone size={16} color={C.text} />
          <Text style={st.linkText}>{t('call')}</Text>
        </Pressable>
        <Pressable style={st.link} onPress={() => phone.length === 10 && open(`https://wa.me/91${phone}`)} disabled={phone.length !== 10}>
          <MessageCircle size={16} color={C.text} />
          <Text style={st.linkText}>{t('whatsapp')}</Text>
        </Pressable>
      </View>

      {canAct && openItems.length > 0 ? (
        <View style={st.actions}>
          <Button label={t('delivered')} onPress={() => onSheet('deliver')} icon={<CheckCircle2 size={20} color="#fff" />} big style={{ flex: 1 }} />
          <Button label={t('problem')} kind="outlineDanger" onPress={() => onSheet('problem')} icon={<AlertTriangle size={16} color={C.red} />} big />
        </View>
      ) : null}
    </View>
  )
}

// A stop that's done: one line with the time (and photo, if any).
export function DoneRow({ stop: s, canAct, onCash }: { stop: Stop; canAct: boolean; onCash: () => void }) {
  const { t } = useT()
  const delivered = s.items.find((i) => i.deliveredAt)
  return (
    <View style={st.done}>
      <CheckCircle2 size={20} color={delivered ? C.green : C.faint} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.doneName} numberOfLines={1}>{s.name} <Text style={st.doneLabel}>· {s.label}</Text></Text>
        <Text style={st.doneMeta}>
          {delivered ? t('deliveredAt', { time: clock(delivered.deliveredAt) }) : t('notToday')}
          {s.items.some((i) => i.hasPhoto) ? ' · 📷' : ''}
        </Text>
      </View>
      {canAct && s.codDue > 0 && !s.cashReport ? (
        <Pressable onPress={onCash} style={st.doneCash}>
          <Text style={st.doneCashText}>{t('cashBtn', { amount: rupees(s.codDue) })}</Text>
        </Pressable>
      ) : null}
      {s.cashReport ? <Text style={st.doneReported}>{t('cashReported', { amount: rupees(s.cashReport.amount) })}</Text> : null}
    </View>
  )
}

const st = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 10 },
  side: { alignItems: 'center', gap: 2 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  arrow: { padding: 2 },
  faded: { opacity: 0.2 },
  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  label: { fontSize: 12, fontWeight: '600', color: C.muted, backgroundColor: C.grey, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  address: { marginTop: 4, fontSize: 14, color: '#374151', lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12, color: C.muted },
  items: { marginTop: 8, gap: 2 },
  item: { fontSize: 14, color: C.text },
  itemDone: { color: C.faint, textDecorationLine: 'line-through' },
  bold: { fontWeight: '600' },
  qty: { fontWeight: '700', color: C.green },
  addons: { color: C.muted },
  note: { marginTop: 8, fontSize: 12, color: C.noteText, backgroundColor: C.noteBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' },
  onTheWay: { marginTop: 8, fontSize: 12, fontWeight: '600', color: C.blue },
  issue: { marginTop: 8, flexDirection: 'row', gap: 6, backgroundColor: C.redSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  issueText: { flex: 1, fontSize: 12, color: C.redDark },
  cash: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: C.amberSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  cashLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cashText: { fontSize: 14, fontWeight: '700', color: C.amber },
  cashBtn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  cashBtnText: { fontSize: 12, fontWeight: '700', color: C.amber },
  links: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border },
  link: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  linkMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  linkText: { fontSize: 14, fontWeight: '600', color: C.text },
  actions: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.border },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12 },
  doneName: { fontSize: 15, fontWeight: '600', color: C.text },
  doneLabel: { fontWeight: '400', color: C.muted, fontSize: 13 },
  doneMeta: { fontSize: 12, color: C.muted, marginTop: 1 },
  doneCash: { backgroundColor: C.amberSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  doneCashText: { fontSize: 12, fontWeight: '700', color: C.amber },
  doneReported: { fontSize: 12, fontWeight: '600', color: C.amber },
})
