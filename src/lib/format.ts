export function rupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function clock(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export function dayLabel(isoDate: string) {
  return new Date(isoDate + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// Calendar-date arithmetic on YYYY-MM-DD, independent of the phone's timezone.
export function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function digits10(phone: string) {
  return phone.replace(/\D/g, '').slice(-10)
}

// Customers see 12–2 / 5–7 in their app.
export const SLOT_HOURS = { lunch: '12–2 PM', dinner: '5–7 PM' } as const
export const RUN_LABEL: Record<string, string> = { morning: 'Morning run', noon: 'Noon run', evening: 'Evening run' }
