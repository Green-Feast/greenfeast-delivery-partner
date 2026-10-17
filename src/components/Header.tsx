import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, LogOut, RefreshCw } from 'lucide-react-native'
import { C } from '@/lib/ui'

export function Header({
  title,
  subtitle,
  onBack,
  onRefresh,
  refreshing,
  onSignOut,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  onSignOut?: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={8} style={s.icon} accessibilityLabel="Back">
          <ArrowLeft size={22} color={C.text} />
        </Pressable>
      )}
      <View style={[s.titles, !onBack && { paddingLeft: 6 }]}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {onRefresh && (
        <Pressable onPress={onRefresh} hitSlop={8} style={s.icon} accessibilityLabel="Refresh">
          {refreshing ? <ActivityIndicator size="small" color={C.muted} /> : <RefreshCw size={20} color={C.muted} />}
        </Pressable>
      )}
      {onSignOut && (
        <Pressable onPress={onSignOut} hitSlop={8} style={s.icon} accessibilityLabel="Sign out">
          <LogOut size={20} color={C.muted} />
        </Pressable>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
})
