import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LANGS, useT } from '@/lib/i18n'
import { C } from '@/lib/ui'

// English · हिंदी · Hinglish
export function LanguagePicker({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useT()
  return (
    <View style={[s.row, compact && { alignSelf: 'flex-end' }]}>
      {LANGS.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => setLang(l.id)}
          style={[s.chip, compact && s.compact, lang === l.id && s.on]}
          accessibilityRole="radio"
          accessibilityState={{ checked: lang === l.id }}
          accessibilityLabel={l.label}
        >
          <Text style={[s.text, lang === l.id && { color: '#fff' }]}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  compact: { flex: 0, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  on: { backgroundColor: C.green, borderColor: C.green },
  text: { fontSize: 14, fontWeight: '600', color: C.text },
})
