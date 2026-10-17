import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider } from '@/lib/session'
import { C } from '@/lib/ui'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        {/* Phone-width on a big screen (the web version on a laptop). */}
        <View style={s.frame}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  frame: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: C.bg },
})
