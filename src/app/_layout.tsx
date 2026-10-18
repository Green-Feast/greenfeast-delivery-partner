import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider } from '@/lib/session'
import { LanguageProvider } from '@/lib/i18n'
import { NotificationsProvider } from '@/lib/notifications'
import { api } from '@/lib/api'
import { C } from '@/lib/ui'

// The language is saved to the partner's account too, so notifications
// arrive in it (fails quietly when signed out — the login screen re-saves it).
function saveLanguage(l: 'en' | 'hi' | 'hinglish') {
  api.setLanguage(l).catch(() => {})
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider onChange={saveLanguage}>
        <SessionProvider>
          <NotificationsProvider>
            <StatusBar style="dark" />
            {/* Phone-width on a big screen (the web version on a laptop). */}
            <View style={s.frame}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
            </View>
          </NotificationsProvider>
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  frame: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: C.bg },
})
