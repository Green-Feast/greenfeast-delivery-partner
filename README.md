# GreenFeast Partner

The delivery partner app. Partners sign in with their phone number and a password from the office and get:
- today's batches and stops in their own order;
- a map and the route in Google Maps;
- buttons to call or WhatsApp the customer;
- **Start delivery**, **Delivered** (optional photo), **Problem** and **Cash collected**.

Every tap reaches the customer app and the admin straight away: status, push message, rider name, delivered time, failed drops and cash to record.

One Expo (React Native) codebase:
- **Android app:** an APK or Play Store build via EAS.
- **iPhone app:** later, if wanted.
- **Website:** hosted on Vercel; partners can use it in the phone's browser today.

## How it fits together

- **No server and no secret keys.** The app talks to the GreenFeast Supabase project with the partner's own login.
- **All reads and actions are database functions:** `partner_me`, `partner_batches`, `partner_batch_stops`, `partner_start_delivery`, `partner_mark_delivered`, `partner_report_problem`, `partner_report_cash` and `partner_save_route`. They're defined in `greenfeast-app/supabase/migrations/060_partner_app_api.sql`.
  - Each one checks the partner, and only touches their own batches, today's meals and their own Live/Test customers.
  - Billing and customer messages run there too, the same as the admin's Delivered button.
- **Logins** come from the admin: Delivery Partners → edit a partner → App login → Create login.
  - The app signs in to the Supabase account `p<10-digit phone>@partners.greenfeast.test`.
  - "Inactive" status, "Remove login" or "New password" cut a phone off.
  - A **Test partner** only sees test customers' meals (the admin's Test mode).
- **Handover photos** go to the private `delivery-photos` bucket. The admin opens them from Operations.
- **The map** is Leaflet with OpenStreetMap tiles inside a WebView (an iframe on the web), so there's no Google Maps API key. "Go" and "Open route" open Google Maps itself.

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go on the phone, or press w for the browser
npm run typecheck
```

## Web version on Vercel

Import this repo as a new Vercel project. `vercel.json` sets everything:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `npx expo export --platform web` |
| Output directory | `dist` |

No environment variables are needed. The Supabase URL and the publishable key are in `src/lib/config.ts`; they're meant to be public.

If the site's address isn't `https://greenfeast-delivery-partner.vercel.app`, change these two to match:
- `PARTNER_APP_URL` in the admin's Vercel env, which goes in the login message the admin sends partners.
- `WEB_URL` in `src/lib/config.ts`.

## Android APK (later)

```bash
npm install -g eas-cli
eas login
eas init                                        # once: links the project to your Expo account
eas build --platform android --profile preview  # an .apk to install on partners' phones
eas build --platform android --profile production   # an .aab for the Play Store
```

The package name is `com.greenfeast.partner`, separate from the customer app's `com.greenfeast.app`.
