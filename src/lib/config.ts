// The Supabase project the customer app and the admin use. The anon
// ("publishable") key is made to ship inside apps: what a partner may see
// and do is enforced in the database (migration 060's partner_* functions),
// not by keeping this key secret. EXPO_PUBLIC_* overrides them if set.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://amwwjcwoumhbdxaxvexj.supabase.co'
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_kxDMXb9_79bl9LoWVwcF0A_o2Q_uTXM'

// Partner logins are made by the admin (Delivery Partners → App login): the
// account behind a partner's phone number is p<10 digits>@partners.greenfeast.test.
export function loginEmail(phoneDigits: string) {
  return `p${phoneDigits}@partners.greenfeast.test`
}

// The web version of this app (Vercel) — the map's tiles are requested as
// coming from here.
export const WEB_URL = 'https://greenfeast-delivery-partner.vercel.app'
