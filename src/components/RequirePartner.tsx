import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { WifiOff } from 'lucide-react-native'
import { useSession } from '@/lib/session'
import type { Me } from '@/lib/api'
import { C } from '@/lib/ui'
import { Button } from './Button'

// Screens that need a signed-in, active partner.
export function RequirePartner({ children }: { children: (me: Me) => React.ReactNode }) {
  const { status, me, reload } = useSession()
  if (status === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.green} size="large" />
      </View>
    )
  }
  if (status === 'offline') {
    return (
      <View style={s.center}>
        <WifiOff size={32} color={C.muted} />
        <Text style={s.text}>No internet — check your connection.</Text>
        <Button label="Try again" onPress={reload} style={{ marginTop: 16, alignSelf: 'stretch' }} />
      </View>
    )
  }
  if (status !== 'signed_in' || !me) return <Redirect href="/login" />
  return <>{children(me)}</>
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: C.bg },
  text: { marginTop: 12, fontSize: 15, color: C.muted, textAlign: 'center' },
})
