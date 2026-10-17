import { supabase } from './supabase'

// Everything the app reads or does is one of the database's partner_*
// functions (greenfeast-app repo, supabase/migrations/060_partner_app_api.sql).
// They check the signed-in partner themselves: only their batches, today's
// meals, their own Live/Test customers. Billing and customer messages run
// there too, exactly like the admin's Delivered button.

export type Slot = 'lunch' | 'dinner'

export type Me = { id: string; name: string; phone: string; is_test: boolean; today: string }

export type DayStats = { stops: number; meals: number; done: number; issues: number; cash: number }

export type PartnerBatch = {
  id: string
  name: string
  area: string | null
  slot: Slot
  time_window: string | null
  role: 'primary' | 'secondary'
  days: Record<string, DayStats>
}

export type StopItem = {
  orderId: string
  meal: string
  qty: number
  extra: boolean
  addons: string[]
  status: string
  deliveredAt: string | null
  outAt: string | null
  issue: string | null
  hasPhoto: boolean
}

export type Stop = {
  key: string
  addressId: string | null
  seq: number | null
  name: string
  phone: string
  label: string
  address: string
  pincode: string | null
  timing: string | null
  lat: number | null
  lng: number | null
  subscriptionId: string
  userId: string
  codDue: number
  cashReport: { id: string; amount: number } | null
  note: string | null
  items: StopItem[]
}

export type BatchDay = {
  batch: { id: string; name: string; area: string | null; slot: Slot; time_window: string | null }
  date: string
  today: string
  stops: Stop[]
}

export const OPEN = ['scheduled', 'confirmed', 'preparing', 'out_for_delivery']
export const NOT_STARTED = ['scheduled', 'confirmed', 'preparing']

export type StopState = 'pending' | 'on_the_way' | 'delivered' | 'issue' | 'closed'

export function stopState(items: { status: string; issue: string | null }[]): StopState {
  const open = items.filter((i) => OPEN.includes(i.status))
  if (open.length === 0) return items.some((i) => i.status === 'delivered') ? 'delivered' : 'closed'
  if (open.some((i) => i.issue)) return 'issue'
  if (open.some((i) => i.status === 'out_for_delivery')) return 'on_the_way'
  return 'pending'
}

function friendly(message: string) {
  if (/fetch|network|timed? ?out/i.test(message)) return 'No internet — check your connection and try again.'
  if (/JWT|not signed in|42501/i.test(message)) return 'Please sign in again.'
  return message
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(friendly(error.message))
  return data as T
}

export const api = {
  me: () => call<Me | null>('partner_me'),
  batches: (dates: string[]) => call<PartnerBatch[]>('partner_batches', { p_dates: dates }),
  batchStops: (batchId: string, date: string) => call<BatchDay | null>('partner_batch_stops', { p_batch: batchId, p_date: date }),
  startDelivery: (batchId: string) => call<{ moved: number }>('partner_start_delivery', { p_batch: batchId }),
  markDelivered: (orderIds: string[], photo: string | null) =>
    call<{ results: Record<string, string>; billed: number; short: number }>('partner_mark_delivered', { p_orders: orderIds, p_photo: photo }),
  reportProblem: (orderIds: string[], reason: string, note: string) =>
    call<{ reported: number }>('partner_report_problem', { p_orders: orderIds, p_reason: reason, p_note: note }),
  reportCash: (orderId: string, amountPaise: number, note: string) =>
    call<{ amount: number }>('partner_report_cash', { p_order: orderId, p_amount: amountPaise, p_note: note }),
  saveRoute: (batchId: string, addressIds: string[]) =>
    call<{ saved: number }>('partner_save_route', { p_batch: batchId, p_addresses: addressIds }),
}

// The handover photo goes straight to the private delivery-photos bucket,
// into today's folder (the storage rule only lets active partners write
// there); partner_mark_delivered then links it to the meal.
export async function uploadPhoto(orderId: string, uri: string, today: string): Promise<string> {
  const path = `${today}/${orderId}-${Math.random().toString(36).slice(2, 10)}.jpg`
  const body = await (await fetch(uri)).arrayBuffer()
  const { error } = await supabase.storage.from('delivery-photos').upload(path, body, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error("The photo didn't upload — try again, or remove it and deliver without one.")
  return path
}
