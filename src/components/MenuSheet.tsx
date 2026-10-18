import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Bell, ChevronRight, LogOut } from 'lucide-react-native'
import { useT } from '@/lib/i18n'
import { useSession } from '@/lib/session'
import { useBell } from '@/lib/notifications'
import { C, confirm } from '@/lib/ui'
import { Sheet } from './Sheet'
import { LanguagePicker } from './LanguagePicker'

export function MenuSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const { signOut } = useSession()
  const { unread } = useBell()

  async function handleSignOut() {
    if (await confirm(t('signOutQ'), t('signOutMsg'), t('signOut'))) {
      onClose()
      signOut()
    }
  }

  return (
    <Sheet title={t('menu')} onClose={onClose}>
      <Text style={s.label}>{t('language')}</Text>
      <LanguagePicker />

      <Pressable style={s.row} onPress={() => { onClose(); router.push('/notifications') }}>
        <Bell size={20} color={C.text} />
        <Text style={s.rowText}>{t('notifications')}</Text>
        {unread > 0 ? <Text style={s.count}>{unread}</Text> : null}
        <ChevronRight size={18} color={C.faint} />
      </Pressable>
      <Pressable style={s.row} onPress={handleSignOut}>
        <LogOut size={20} color={C.red} />
        <Text style={[s.rowText, { color: C.red }]}>{t('signOut')}</Text>
      </Pressable>
      <View style={{ height: 8 }} />
    </Sheet>
  )
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: C.muted, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginTop: 8 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600', color: C.text },
  count: { fontSize: 12, fontWeight: '700', color: '#fff', backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
})
