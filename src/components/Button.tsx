import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { C } from '@/lib/ui'

type Kind = 'primary' | 'danger' | 'cash' | 'outline' | 'outlineDanger'

const BG: Record<Kind, string> = {
  primary: C.green,
  danger: C.red,
  cash: C.amberButton,
  outline: '#fff',
  outlineDanger: '#fff',
}
const FG: Record<Kind, string> = {
  primary: '#fff',
  danger: '#fff',
  cash: '#fff',
  outline: C.green,
  outlineDanger: C.red,
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  busy,
  disabled,
  big,
  style,
}: {
  label: string
  onPress: () => void
  kind?: Kind
  icon?: React.ReactNode
  busy?: boolean
  disabled?: boolean
  big?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const outline = kind === 'outline' || kind === 'outlineDanger'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        big && s.big,
        { backgroundColor: BG[kind] },
        outline && { borderWidth: 1, borderColor: kind === 'outline' ? 'rgba(27,94,32,0.3)' : C.redBorder },
        (pressed || disabled || busy) && { opacity: 0.7 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.row}>
        {busy ? <ActivityIndicator size="small" color={FG[kind]} /> : icon}
        <Text style={[s.label, big && s.bigLabel, { color: FG[kind] }]}>{label}</Text>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  btn: { minHeight: 46, borderRadius: 14, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  big: { minHeight: 56 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  bigLabel: { fontSize: 16 },
})
