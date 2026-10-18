import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Eye, EyeOff } from 'lucide-react-native'
import { useSession } from '@/lib/session'
import { C } from '@/lib/ui'
import { Button } from '@/components/Button'
import { LanguagePicker } from '@/components/LanguagePicker'
import { useT, type Key } from '@/lib/i18n'
import { api } from '@/lib/api'

// Sign in with the phone number and password the office set up
// (admin → Delivery Partners → App login).
export default function LoginScreen() {
  const { status, signIn } = useSession()
  const { t, lang } = useT()
  const insets = useSafeAreaInsets()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Key | ''>('')

  if (status === 'signed_in') return <Redirect href="/" />

  async function submit() {
    setBusy(true)
    setError('')
    const err = await signIn(phone, password)
    setBusy(false)
    if (err) setError(err)
    // The language picked here goes to the account (notifications use it).
    else api.setLanguage(lang).catch(() => {})
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[s.page, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
        <LanguagePicker compact />
        <Image source={require('../../assets/icon.png')} style={s.logo} />
        <Text style={s.title}>{t('appName')}</Text>
        <Text style={s.sub}>{t('loginSub')}</Text>

        <Text style={s.label}>{t('phone')}</Text>
        <View style={s.field}>
          <Text style={s.prefix}>+91</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="98765 43210"
            placeholderTextColor={C.faint}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={14}
            style={s.input}
            accessibilityLabel={t('phone')}
          />
        </View>

        <Text style={s.label}>{t('password')}</Text>
        <View style={s.field}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            style={[s.input, { paddingLeft: 16 }]}
            onSubmitEditing={submit}
            returnKeyType="go"
            accessibilityLabel={t('password')}
          />
          <Pressable onPress={() => setShow((v) => !v)} style={s.eye} accessibilityLabel={show ? t('hidePassword') : t('showPassword')}>
            {show ? <EyeOff size={20} color={C.muted} /> : <Eye size={20} color={C.muted} />}
          </Pressable>
        </View>

        {error ? <Text style={s.error}>{t(error)}</Text> : null}
        <Button label={t('signIn')} onPress={submit} busy={busy} big style={{ marginTop: 22 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, backgroundColor: C.bg },
  logo: { width: 64, height: 64, borderRadius: 16, marginTop: 20 },
  title: { marginTop: 22, fontSize: 26, fontWeight: '700', color: C.text },
  sub: { marginTop: 6, fontSize: 14, color: C.muted, lineHeight: 20 },
  label: { marginTop: 22, fontSize: 14, fontWeight: '600', color: '#4B5563' },
  field: { marginTop: 8, height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  prefix: { paddingLeft: 16, paddingRight: 8, fontSize: 17, color: C.muted },
  input: { flex: 1, height: '100%', fontSize: 18, color: C.text, paddingRight: 12 },
  eye: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  error: { marginTop: 16, fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderWidth: 1, borderColor: C.redBorder, borderRadius: 12, padding: 12, overflow: 'hidden' },
})
