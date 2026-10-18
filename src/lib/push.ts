import { Platform } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { api } from './api'

// Push notifications (migration 062: notify_partner sends them through Expo).
// expo-notifications throws at import time in Expo Go (SDK 53+), so it's only
// required in real builds; the web version has the bell list but no push.
const supported = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient

type NotificationsModule = typeof import('expo-notifications')
let N: NotificationsModule | null = null
if (supported) {
  N = require('expo-notifications') as NotificationsModule
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

let registeredToken: string | null = null

// Ask permission, get this phone's Expo push token and save it to the
// partner's account. Quietly does nothing where push isn't available.
export async function registerPush() {
  if (!N) return
  try {
    const Device = require('expo-device') as typeof import('expo-device')
    if (!Device.isDevice) return
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('deliveries', {
        name: 'Deliveries',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B5E20',
      })
    }
    let { status } = await N.getPermissionsAsync()
    if (status !== 'granted') status = (await N.requestPermissionsAsync()).status
    if (status !== 'granted') return
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
    if (!projectId) return
    const { data: token } = await N.getExpoPushTokenAsync({ projectId })
    if (token && token !== registeredToken) {
      await api.setPushToken(token)
      registeredToken = token
    }
  } catch (e) {
    console.warn('registerPush:', e)
  }
}

export async function unregisterPush() {
  if (!registeredToken) return
  registeredToken = null
  await api.setPushToken(null).catch(() => {})
}

// Tapping a notification: its batch if it has one, otherwise the list.
// Returns an unsubscribe function.
export function onNotificationTap(open: (batchId: string | null) => void): () => void {
  if (!N) return () => {}
  const handle = (data: unknown) => {
    const batchId = (data as { batch_id?: string } | undefined)?.batch_id ?? null
    open(batchId)
  }
  const sub = N.addNotificationResponseReceivedListener((r) => handle(r.notification.request.content.data))
  // Opened from a notification while the app was closed.
  N.getLastNotificationResponseAsync()
    .then((r) => { if (r) handle(r.notification.request.content.data) })
    .catch(() => {})
  return () => sub.remove()
}

// A push arrived while the app is open — refresh the bell.
export function onNotificationReceived(cb: () => void): () => void {
  if (!N) return () => {}
  const sub = N.addNotificationReceivedListener(() => cb())
  return () => sub.remove()
}
