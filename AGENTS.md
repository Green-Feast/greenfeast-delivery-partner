# GreenFeast Partner — notes for whoever changes this app

- **Expo SDK 56, React Native 0.85, expo-router.** Screens live in `src/app` and `@/` means `src/`.
  - Add packages with `npx expo install <pkg>` so the versions match the SDK.
  - `react-native-reanimated` 4.3.1, `react-native-worklets` 0.8.3 and `react-native-gesture-handler` ~2.31.1 are pinned on purpose: expo-router pulls reanimated in, and the newest reanimated needs React Native 0.86 or later.
- **The same code runs on phones and the web.** Check both when changing UI (`npm run web` / Expo Go).
  - Use `confirm()` from `src/lib/ui.ts`, not `Alert.alert` with buttons: that one does nothing on the web.
  - Platform files: `RouteMap.tsx` (WebView) and `RouteMap.web.tsx` (iframe).
- **No service key, no server.** Everything goes through the database's `partner_*` functions (greenfeast-app repo, migration 060), which check the signed-in partner.
  - Need new data or a new action? Add or extend a function there.
  - Don't open tables to partners with RLS.
  - Storage rules can't read `delivery_partners` as the user; use `public.is_active_partner()`.
- **Billing and messages run inside those functions** (`advance_order_delivered`, `notify_event`). The admin's Operations buttons (greenfeast-admin `lib/delivery.ts`) do the same from the server, so keep the two in step.
- **The "Couldn't deliver" reasons** in `src/lib/ui.ts` must match the list in `partner_report_problem()`.
- **The map is Leaflet + OpenStreetMap** (`src/components/mapHtml.ts`). Don't switch to `react-native-maps`: it needs a Google API key per app, and a missing key crashes Android (that happened in the customer app).
- **Logins:** the admin creates them (Delivery Partners → App login). The email is `p<10 digits>@partners.greenfeast.test` (`loginEmail()` in `src/lib/config.ts`); keep it in step with the admin's `partnerEmail()`.
