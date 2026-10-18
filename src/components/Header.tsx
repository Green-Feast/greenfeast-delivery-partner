import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bell, Menu, RefreshCw } from 'lucide-react-native'
import { C } from '@/lib/ui'
import { useT } from '@/lib/i18n'

export function Header({
  title,
  subtitle,
  onBack,
  onRefresh,
  refreshing,
  onBell,
  unread = 0,
  onMenu,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  onBell?: () => void
  unread?: number
  onMenu?: () => void
}) {
  const insets = useSafeAreaInsets()
  const { t } = useT()
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={8} style={s.icon} accessibilityLabel={t('back')}>
          <ArrowLeft size={22} color={C.text} />
        </Pressable>
      )}
      <View style={[s.titles, !onBack && { paddingLeft: 6 }]}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {onRefresh && (
        <Pressable onPress={onRefresh} hitSlop={8} style={s.icon} accessibilityLabel={t('refresh')}>
          {refreshing ? <ActivityIndicator size="small" color={C.muted} /> : <RefreshCw size={20} color={C.muted} />}
        </Pressable>
      )}
      {onBell && (
        <Pressable onPress={onBell} hitSlop={8} style={s.icon} accessibilityLabel={t('notifications')}>
          <Bell size={20} color={C.muted} />
          {unread > 0 ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      )}
      {onMenu && (
        <Pressable onPress={onMenu} hitSlop={8} style={s.icon} accessibilityLabel={t('menu')}>
          <Menu size={21} color={C.muted} />
        </Pressable>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 1 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
