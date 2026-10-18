import { useState } from 'react'
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { AlertTriangle, Banknote, Camera, CheckCircle2, X } from 'lucide-react-native'
import { api, OPEN, uploadPhoto, type Stop } from '@/lib/api'
import { rupees } from '@/lib/format'
import { C, PROBLEM_REASONS } from '@/lib/ui'
import { REASON_KEYS, useT } from '@/lib/i18n'
import { Button } from './Button'
import { Sheet } from './Sheet'

type Done = (ok: boolean, text: string) => void

function ItemList({ stop }: { stop: Stop }) {
  return (
    <View style={{ gap: 4 }}>
      {stop.items.filter((i) => OPEN.includes(i.status)).map((it) => (
        <Text key={it.orderId} style={st.item}>
          • <Text style={{ fontWeight: '600' }}>{it.meal}</Text>
          {it.qty > 1 ? <Text style={{ fontWeight: '700', color: C.green }}> ×{it.qty}</Text> : null}
          {it.addons.length > 0 ? <Text style={{ color: C.muted }}> · {it.addons.join(', ')}</Text> : null}
        </Text>
      ))}
    </View>
  )
}

// Phone photos are several MB; the handover proof only needs ~200 KB.
async function shrink(asset: ImagePicker.ImagePickerAsset) {
  const ctx = ImageManipulator.manipulate(asset.uri)
  if (Math.max(asset.width, asset.height) > 1280) {
    ctx.resize(asset.width >= asset.height ? { width: 1280 } : { height: 1280 })
  }
  const image = await ctx.renderAsync()
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })
  return saved.uri
}

export function DeliverSheet({ stop, today, onClose, onDone }: { stop: Stop; today: string; onClose: () => void; onDone: Done }) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { t, error: tError } = useT()
  const open = stop.items.filter((i) => OPEN.includes(i.status))

  async function takePhoto() {
    setError('')
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync()
        if (!perm.granted) return setError(t('cameraDenied'))
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      if (res.canceled || !res.assets?.[0]) return
      setPhoto(await shrink(res.assets[0]))
    } catch (e) {
      setError(tError(e))
    }
  }

  async function confirmDelivered() {
    setBusy(true)
    setError('')
    try {
      const path = photo ? await uploadPhoto(open[0].orderId, photo, today) : null
      const r = await api.markDelivered(open.map((i) => i.orderId), path)
      if (r.short > 0) {
        onDone(false, t('walletShort'))
      } else {
        onDone(true, t('deliveredToast', { name: stop.name }))
      }
      onClose()
    } catch (e) {
      setError(tError(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={t('handOver', { name: stop.name })} onClose={onClose}>
      <ItemList stop={stop} />
      {stop.codDue > 0 && !stop.cashReport ? (
        <Text style={st.remind}>{t('remindCash', { amount: rupees(stop.codDue) })}</Text>
      ) : null}

      <Pressable onPress={takePhoto} style={st.photoBtn}>
        <Camera size={20} color={C.muted} />
        <Text style={st.photoText}>{photo ? t('retakePhoto') : t('addPhoto')}</Text>
      </Pressable>
      {photo ? (
        <View style={st.previewWrap}>
          <Image source={{ uri: photo }} style={st.preview} resizeMode="cover" />
          <Pressable onPress={() => setPhoto(null)} style={st.remove} accessibilityLabel={t('removePhoto')}>
            <X size={16} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={st.error}>{error}</Text> : null}
      <Button label={t('markDelivered')} onPress={confirmDelivered} busy={busy} big icon={<CheckCircle2 size={20} color="#fff" />} style={{ marginTop: 18 }} />
    </Sheet>
  )
}

export function ProblemSheet({ stop, onClose, onDone }: { stop: Stop; onClose: () => void; onDone: Done }) {
  const { t, error: tError } = useT()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!reason) return setError(t('pickReason'))
    setBusy(true)
    setError('')
    try {
      await api.reportProblem(stop.items.filter((i) => OPEN.includes(i.status)).map((i) => i.orderId), reason, note)
      onDone(true, t('reportedToast'))
      onClose()
    } catch (e) {
      setError(tError(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={t('couldntDeliver', { name: stop.name })} onClose={onClose}>
      <Text style={st.help}>{t('problemHelp')}</Text>
      <View style={st.reasons}>
        {PROBLEM_REASONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setReason(r)}
            style={[st.reason, reason === r && st.reasonOn]}
            accessibilityRole="radio"
            accessibilityLabel={r}
            accessibilityHint={t(REASON_KEYS[r])}
            accessibilityState={{ checked: reason === r }}
          >
            <Text style={[st.reasonText, reason === r && { color: C.redDark }]}>{t(REASON_KEYS[r])}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('anythingElse')}
        placeholderTextColor={C.faint}
        maxLength={200}
        multiline
        style={[st.input, { minHeight: 64, textAlignVertical: 'top' }]}
      />
      {error ? <Text style={st.error}>{error}</Text> : null}
      <Button label={t('reportToOffice')} kind="danger" onPress={send} busy={busy} big icon={<AlertTriangle size={20} color="#fff" />} style={{ marginTop: 14 }} />
    </Sheet>
  )
}

export function CashSheet({ stop, onClose, onDone }: { stop: Stop; onClose: () => void; onDone: Done }) {
  const { t, error: tError } = useT()
  const [amount, setAmount] = useState(String((stop.cashReport?.amount ?? stop.codDue) / 100))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    const paise = Math.round((parseFloat(amount) || 0) * 100)
    if (paise <= 0) return setError(t('enterAmount'))
    setBusy(true)
    setError('')
    try {
      await api.reportCash(stop.items[0].orderId, paise, note)
      onDone(true, t('cashToast', { amount: rupees(paise) }))
      onClose()
    } catch (e) {
      setError(tError(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={t('cashFrom', { name: stop.name })} onClose={onClose}>
      <Text style={st.help}>{t('cashHelp', { amount: rupees(stop.codDue) })}</Text>
      <View style={st.amountRow}>
        <Text style={st.rupee}>₹</Text>
        <TextInput
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))}
          keyboardType="decimal-pad"
          style={st.amount}
          accessibilityLabel={t('amountCollected')}
        />
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('cashNote')}
        placeholderTextColor={C.faint}
        maxLength={200}
        style={st.input}
      />
      {error ? <Text style={st.error}>{error}</Text> : null}
      <Button label={t('reportCash')} kind="cash" onPress={send} busy={busy} big icon={<Banknote size={20} color="#fff" />} style={{ marginTop: 14 }} />
    </Sheet>
  )
}

const st = StyleSheet.create({
  item: { fontSize: 15, color: C.text },
  remind: { marginTop: 12, fontSize: 14, fontWeight: '600', color: C.amber, backgroundColor: C.amberSoft, borderRadius: 10, padding: 10, overflow: 'hidden' },
  photoBtn: { marginTop: 16, height: 50, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoText: { fontSize: 14, fontWeight: '600', color: C.muted },
  previewWrap: { marginTop: 12 },
  preview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: C.grey },
  remove: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 6 },
  error: { marginTop: 12, fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderRadius: 10, padding: 10, overflow: 'hidden' },
  help: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  reasons: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { width: '48%', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10 },
  reasonOn: { borderColor: C.red, backgroundColor: C.redSoft },
  reasonText: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center' },
  input: { marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text },
  amountRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', height: 58, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14 },
  rupee: { fontSize: 20, color: C.muted, marginRight: 6 },
  amount: { flex: 1, fontSize: 22, fontWeight: '700', color: C.text, height: '100%' },
})
