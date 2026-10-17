import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '@/lib/ui'

export type ToastMessage = { ok: boolean; text: string } | null

export function useToast() {
  const [toast, setToast] = useState<ToastMessage>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), ok ? 3000 : 6000)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return { toast, show }
}

// Never in the way: taps go through to whatever is underneath.
export function Toast({ toast }: { toast: ToastMessage }) {
  const insets = useSafeAreaInsets()
  if (!toast) return null
  return (
    <View style={[s.toast, { bottom: insets.bottom + 20, backgroundColor: toast.ok ? C.green : C.red }]}>
      <Text style={s.text}>{toast.text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    pointerEvents: 'none',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
