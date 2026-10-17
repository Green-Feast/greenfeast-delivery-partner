import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Eye, EyeOff } from 'lucide-react-native'
import { useSession } from '@/lib/session'
import { C } from '@/lib/ui'
import { Button } from '@/components/Button'

// Sign in with the phone number and password the office set up
// (admin → Delivery Partners → App login).
export default function LoginScreen() {
  const { status, signIn } = useSession()
  const insets = useSafeAreaInsets()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'signed_in') return <Redirect href="/" />

  async function submit() {
    setBusy(true)
    setError('')
    const err = await signIn(phone, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[s.page, { paddingTop: insets.top + 48 }]} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/icon.png')} style={s.logo} />
        <Text style={s.title}>GreenFeast Partner</Text>
        <Text style={s.sub}>Sign in with the phone number and password the office gave you.</Text>

        <Text style={s.label}>Phone number</Text>
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
            accessibilityLabel="Phone number"
          />
        </View>

        <Text style={s.label}>Password</Text>
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
            accessibilityLabel="Password"
          />
          <Pressable onPress={() => setShow((v) => !v)} style={s.eye} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={20} color={C.muted} /> : <Eye size={20} color={C.muted} />}
          </Pressable>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button label="Sign in" onPress={submit} busy={busy} big style={{ marginTop: 22 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, backgroundColor: C.bg },
  logo: { width: 64, height: 64, borderRadius: 16 },
  title: { marginTop: 22, fontSize: 26, fontWeight: '700', color: C.text },
  sub: { marginTop: 6, fontSize: 14, color: C.muted, lineHeight: 20 },
  label: { marginTop: 22, fontSize: 14, fontWeight: '600', color: '#4B5563' },
  field: { marginTop: 8, height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  prefix: { paddingLeft: 16, paddingRight: 8, fontSize: 17, color: C.muted },
  input: { flex: 1, height: '100%', fontSize: 18, color: C.text, paddingRight: 12 },
  eye: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  error: { marginTop: 16, fontSize: 14, color: '#B91C1C', backgroundColor: C.redSoft, borderWidth: 1, borderColor: C.redBorder, borderRadius: 12, padding: 12, overflow: 'hidden' },
})
