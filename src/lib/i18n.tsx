import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// English, Hindi (हिंदी) and Hinglish. The choice is kept on the phone and
// saved to the partner's account so notifications arrive in it too
// (partner_set_language, migration 062). Customer names, addresses and dish
// names are shown as they are.

export type Lang = 'en' | 'hi' | 'hinglish'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'hinglish', label: 'Hinglish' },
]

const en = {
  appName: 'GreenFeast Partner',
  loginSub: 'Sign in with the phone number and password the office gave you.',
  phone: 'Phone number',
  password: 'Password',
  signIn: 'Sign in',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  errEnterPhonePw: 'Enter your 10-digit phone number and password.',
  errWrongLogin: 'Wrong phone number or password.',
  errNoInternet: 'No internet — check your connection and try again.',
  errLoginOff: 'Your login is switched off. Please call the GreenFeast office.',
  errSignInAgain: 'Please sign in again.',
  errBatchNotYours: "That batch isn't yours any more — ask the office.",
  errRefresh: "Some of these meals aren't on your list any more — refresh.",
  errPhoto: "That photo doesn't belong to this stop — take it again.",
  errStopDone: 'This stop is already done.',
  errNoCash: 'No cash is due from this customer.',
  genericError: 'Something went wrong. Try again.',
  hi: 'Hi {name}',
  lunch: 'Lunch',
  dinner: 'Dinner',
  noBatches: 'No batches are assigned to you yet. Ask the office to add you to a batch.',
  tomorrow: 'Tomorrow',
  today: 'Today',
  noDeliveriesToday: 'No deliveries today.',
  stop1: '1 stop',
  stopN: '{n} stops',
  meal1: '1 meal',
  mealN: '{n} meals',
  done: '{done}/{total} done',
  problem1: '1 problem',
  problemN: '{n} problems',
  collect: 'Collect {amount}',
  backup: 'Backup',
  run_morning: 'Morning run',
  run_noon: 'Noon run',
  run_evening: 'Evening run',
  signOutQ: 'Sign out?',
  signOutMsg: 'You can sign in again with your phone number and password.',
  signOut: 'Sign out',
  cancel: 'Cancel',
  loadBatchesFail: 'Could not load your batches.',
  batchNotFound: 'Batch not found',
  notAssigned: "This batch isn't assigned to you any more.",
  loading: 'Loading…',
  stopsDone: '{done}/{total} stops done',
  viewOnly: 'Looking at {date} — you can mark deliveries only on the day.',
  startDelivery: 'Start delivery ({meals})',
  startQ: 'Start delivery?',
  startMsg: '{meals} will show "on the way" and the customers get a message.',
  start: 'Start',
  startedToast: '{meals} on the way — customers have been told.',
  alreadyOnWay: 'Everything here is already on the way.',
  startFail: 'Could not start the delivery.',
  list: 'List',
  map: 'Map',
  nearest: 'Nearest',
  openRoute: 'Open route in Google Maps',
  next10: ' (next 10 stops)',
  noDeliveriesBatch: 'No deliveries in this batch.',
  noPin: '{n} without a map pin — see the list.',
  doneHead: 'DONE',
  allowLocation: 'Allow location for GreenFeast Partner to sort by distance.',
  sortedNoPin: 'Sorted — {n} without a pin went last.',
  sorted: 'Sorted by distance from you.',
  locationFail: "Couldn't get your location — try again outside.",
  saveOrderFail: 'Could not save the order.',
  loadStopsFail: 'Could not load the stops.',
  moveUp: 'Move up',
  moveDown: 'Move down',
  onTheWay: 'On the way · customer has been told',
  reported: 'Reported: {issue}. The office will decide — you can still mark it delivered.',
  note: 'Note: {note}',
  cashReported: '{amount} reported',
  collectCash: 'Collect {amount} cash',
  change: 'Change',
  cashCollected: 'Cash collected',
  go: 'Go',
  call: 'Call',
  whatsapp: 'WhatsApp',
  delivered: 'Delivered',
  problem: 'Problem',
  deliveredAt: 'Delivered {time}',
  notToday: 'Not delivering today',
  cashBtn: 'Cash {amount}',
  handOver: 'Hand over to {name}?',
  remindCash: 'Remember to collect {amount} cash.',
  addPhoto: 'Add photo (optional)',
  retakePhoto: 'Retake photo',
  removePhoto: 'Remove photo',
  cameraDenied: 'Allow camera access in Settings to add a photo.',
  markDelivered: 'Mark delivered',
  walletShort: "The customer's wallet is short — this meal was NOT billed and they've been told. Call the office before handing it over.",
  deliveredToast: '{name} — delivered ✓',
  photoUploadFail: "The photo didn't upload — try again, or remove it and deliver without one.",
  couldntDeliver: "Couldn't deliver to {name}?",
  problemHelp: "Call the customer first. If it still can't be handed over, tell the office why — the meal isn't charged until they decide.",
  anythingElse: 'Anything else? (optional)',
  pickReason: 'Pick a reason.',
  reportToOffice: 'Report to office',
  reportedToast: 'Reported — the office will sort it out. You can still mark it delivered later.',
  cashFrom: 'Cash from {name}',
  cashHelp: 'Due: {amount}. Enter what you actually collected — the office records it when you hand the cash over.',
  amountCollected: 'Amount collected',
  cashNote: 'Note (optional) — e.g. paid part, rest tomorrow',
  enterAmount: 'Enter the amount you collected.',
  reportCash: 'Report cash collected',
  cashToast: '{amount} reported — hand it to the office.',
  offline: 'No internet — check your connection.',
  tryAgain: 'Try again',
  notifications: 'Notifications',
  noNotifications: 'No notifications yet.',
  language: 'Language',
  menu: 'Menu',
  back: 'Back',
  refresh: 'Refresh',
  close: 'Close',
  reason_notAnswering: 'Not answering',
  reason_wrongAddress: 'Wrong address',
  reason_refused: 'Customer refused',
  reason_noOneHome: 'No one home / gate locked',
  reason_other: 'Other',
}

export type Key = keyof typeof en

const hi: Record<Key, string> = {
  appName: 'GreenFeast Partner',
  loginSub: 'ऑफिस से मिला फ़ोन नंबर और पासवर्ड डालकर साइन इन करें।',
  phone: 'फ़ोन नंबर',
  password: 'पासवर्ड',
  signIn: 'साइन इन करें',
  showPassword: 'पासवर्ड दिखाएँ',
  hidePassword: 'पासवर्ड छिपाएँ',
  errEnterPhonePw: 'अपना 10 अंकों का फ़ोन नंबर और पासवर्ड डालें।',
  errWrongLogin: 'फ़ोन नंबर या पासवर्ड गलत है।',
  errNoInternet: 'इंटरनेट नहीं है — कनेक्शन देखकर दोबारा कोशिश करें।',
  errLoginOff: 'आपका लॉगिन बंद है। कृपया GreenFeast ऑफिस को कॉल करें।',
  errSignInAgain: 'कृपया दोबारा साइन इन करें।',
  errBatchNotYours: 'यह बैच अब आपका नहीं है — ऑफिस से पूछें।',
  errRefresh: 'इनमें से कुछ मील अब आपकी लिस्ट में नहीं हैं — रीफ़्रेश करें।',
  errPhoto: 'यह फ़ोटो इस स्टॉप की नहीं है — दोबारा लें।',
  errStopDone: 'यह स्टॉप पहले ही हो चुका है।',
  errNoCash: 'इस ग्राहक से कोई कैश बाकी नहीं है।',
  genericError: 'कुछ गड़बड़ हुई। दोबारा कोशिश करें।',
  hi: 'नमस्ते {name}',
  lunch: 'लंच',
  dinner: 'डिनर',
  noBatches: 'अभी आपको कोई बैच नहीं मिला है। ऑफिस से कहें कि आपको बैच में जोड़ें।',
  tomorrow: 'कल',
  today: 'आज',
  noDeliveriesToday: 'आज कोई डिलीवरी नहीं।',
  stop1: '1 स्टॉप',
  stopN: '{n} स्टॉप',
  meal1: '1 मील',
  mealN: '{n} मील',
  done: '{done}/{total} हो गए',
  problem1: '1 समस्या',
  problemN: '{n} समस्याएँ',
  collect: '{amount} लेने हैं',
  backup: 'बैकअप',
  run_morning: 'सुबह का राउंड',
  run_noon: 'दोपहर का राउंड',
  run_evening: 'शाम का राउंड',
  signOutQ: 'साइन आउट करें?',
  signOutMsg: 'आप फ़ोन नंबर और पासवर्ड से दोबारा साइन इन कर सकते हैं।',
  signOut: 'साइन आउट',
  cancel: 'रद्द करें',
  loadBatchesFail: 'आपके बैच लोड नहीं हो सके।',
  batchNotFound: 'बैच नहीं मिला',
  notAssigned: 'यह बैच अब आपको नहीं दिया गया है।',
  loading: 'लोड हो रहा है…',
  stopsDone: '{done}/{total} स्टॉप हो गए',
  viewOnly: '{date} देख रहे हैं — डिलीवरी उसी दिन मार्क कर सकते हैं।',
  startDelivery: 'डिलीवरी शुरू करें ({meals})',
  startQ: 'डिलीवरी शुरू करें?',
  startMsg: '{meals} "रास्ते में" दिखेंगे और ग्राहकों को मैसेज जाएगा।',
  start: 'शुरू करें',
  startedToast: '{meals} रास्ते में — ग्राहकों को बता दिया गया है।',
  alreadyOnWay: 'यहाँ सब पहले से रास्ते में है।',
  startFail: 'डिलीवरी शुरू नहीं हो सकी।',
  list: 'लिस्ट',
  map: 'नक्शा',
  nearest: 'सबसे पास',
  openRoute: 'Google Maps में रास्ता खोलें',
  next10: ' (अगले 10 स्टॉप)',
  noDeliveriesBatch: 'इस बैच में कोई डिलीवरी नहीं।',
  noPin: '{n} का नक्शे पर निशान नहीं है — लिस्ट देखें।',
  doneHead: 'हो गए',
  allowLocation: 'दूरी से लगाने के लिए GreenFeast Partner को लोकेशन की अनुमति दें।',
  sortedNoPin: 'लगा दिए — बिना निशान वाले {n} आख़िर में हैं।',
  sorted: 'आपसे दूरी के हिसाब से लगा दिए।',
  locationFail: 'आपकी लोकेशन नहीं मिली — बाहर जाकर दोबारा कोशिश करें।',
  saveOrderFail: 'क्रम सेव नहीं हुआ।',
  loadStopsFail: 'स्टॉप लोड नहीं हो सके।',
  moveUp: 'ऊपर करें',
  moveDown: 'नीचे करें',
  onTheWay: 'रास्ते में · ग्राहक को बता दिया गया',
  reported: 'बताया: {issue}। ऑफिस फ़ैसला करेगा — आप अब भी डिलीवर मार्क कर सकते हैं।',
  note: 'नोट: {note}',
  cashReported: '{amount} बताया गया',
  collectCash: '{amount} कैश लें',
  change: 'बदलें',
  cashCollected: 'कैश मिला',
  go: 'चलें',
  call: 'कॉल',
  whatsapp: 'WhatsApp',
  delivered: 'डिलीवर हो गया',
  problem: 'समस्या',
  deliveredAt: '{time} पर डिलीवर',
  notToday: 'आज डिलीवरी नहीं',
  cashBtn: 'कैश {amount}',
  handOver: '{name} को दे दिया?',
  remindCash: '{amount} कैश लेना याद रखें।',
  addPhoto: 'फ़ोटो जोड़ें (ज़रूरी नहीं)',
  retakePhoto: 'फ़ोटो दोबारा लें',
  removePhoto: 'फ़ोटो हटाएँ',
  cameraDenied: 'फ़ोटो के लिए सेटिंग्स में कैमरा की अनुमति दें।',
  markDelivered: 'डिलीवर मार्क करें',
  walletShort: 'ग्राहक के वॉलेट में पैसे कम हैं — यह मील बिल नहीं हुआ और उन्हें बता दिया गया है। देने से पहले ऑफिस को कॉल करें।',
  deliveredToast: '{name} — डिलीवर ✓',
  photoUploadFail: 'फ़ोटो अपलोड नहीं हुई — दोबारा कोशिश करें, या फ़ोटो हटाकर डिलीवर करें।',
  couldntDeliver: '{name} को डिलीवर नहीं हो सका?',
  problemHelp: 'पहले ग्राहक को कॉल करें। फिर भी न दे पाएँ तो ऑफिस को वजह बताएँ — ऑफिस के फ़ैसले तक मील का पैसा नहीं कटेगा।',
  anythingElse: 'कुछ और? (ज़रूरी नहीं)',
  pickReason: 'कोई वजह चुनें।',
  reportToOffice: 'ऑफिस को बताएँ',
  reportedToast: 'बता दिया — ऑफिस देख लेगा। बाद में भी डिलीवर मार्क कर सकते हैं।',
  cashFrom: '{name} से कैश',
  cashHelp: 'बाकी: {amount}। जितना असल में मिला वो लिखें — कैश देने पर ऑफिस दर्ज करेगा।',
  amountCollected: 'मिली रकम',
  cashNote: 'नोट (ज़रूरी नहीं) — जैसे आधा दिया, बाकी कल',
  enterAmount: 'जितना मिला वो रकम लिखें।',
  reportCash: 'कैश मिलने की रिपोर्ट करें',
  cashToast: '{amount} बता दिया — ऑफिस को दे दें।',
  offline: 'इंटरनेट नहीं है — कनेक्शन देखें।',
  tryAgain: 'दोबारा कोशिश करें',
  notifications: 'सूचनाएँ',
  noNotifications: 'अभी कोई सूचना नहीं।',
  language: 'भाषा',
  menu: 'मेनू',
  back: 'वापस',
  refresh: 'रीफ़्रेश',
  close: 'बंद करें',
  reason_notAnswering: 'फ़ोन नहीं उठा रहे',
  reason_wrongAddress: 'गलत पता',
  reason_refused: 'ग्राहक ने मना किया',
  reason_noOneHome: 'घर पर कोई नहीं / गेट बंद',
  reason_other: 'अन्य',
}

const hinglish: Record<Key, string> = {
  appName: 'GreenFeast Partner',
  loginSub: 'Office ne jo phone number aur password diya, usse sign in karo.',
  phone: 'Phone number',
  password: 'Password',
  signIn: 'Sign in karo',
  showPassword: 'Password dikhao',
  hidePassword: 'Password chhupao',
  errEnterPhonePw: 'Apna 10 digit phone number aur password daalo.',
  errWrongLogin: 'Phone number ya password galat hai.',
  errNoInternet: 'Internet nahi hai — connection check karke dobara try karo.',
  errLoginOff: 'Aapka login band hai. GreenFeast office ko call karo.',
  errSignInAgain: 'Dobara sign in karo.',
  errBatchNotYours: 'Ye batch ab aapka nahi hai — office se pucho.',
  errRefresh: 'Inme se kuch meals ab aapki list mein nahi hain — refresh karo.',
  errPhoto: 'Ye photo is stop ki nahi hai — dobara lo.',
  errStopDone: 'Ye stop pehle hi ho chuka hai.',
  errNoCash: 'Is customer se koi cash baaki nahi hai.',
  genericError: 'Kuch gadbad hui. Dobara try karo.',
  hi: 'Hi {name}',
  lunch: 'Lunch',
  dinner: 'Dinner',
  noBatches: 'Abhi aapko koi batch nahi mila. Office se bolo ki aapko batch mein add karein.',
  tomorrow: 'Kal',
  today: 'Aaj',
  noDeliveriesToday: 'Aaj koi delivery nahi.',
  stop1: '1 stop',
  stopN: '{n} stops',
  meal1: '1 meal',
  mealN: '{n} meals',
  done: '{done}/{total} ho gaye',
  problem1: '1 problem',
  problemN: '{n} problems',
  collect: '{amount} lena hai',
  backup: 'Backup',
  run_morning: 'Morning round',
  run_noon: 'Dopahar ka round',
  run_evening: 'Shaam ka round',
  signOutQ: 'Sign out karna hai?',
  signOutMsg: 'Phone number aur password se dobara sign in kar sakte ho.',
  signOut: 'Sign out',
  cancel: 'Cancel',
  loadBatchesFail: 'Aapke batch load nahi hue.',
  batchNotFound: 'Batch nahi mila',
  notAssigned: 'Ye batch ab aapko nahi diya gaya.',
  loading: 'Load ho raha hai…',
  stopsDone: '{done}/{total} stops ho gaye',
  viewOnly: '{date} dekh rahe ho — delivery usi din mark kar sakte ho.',
  startDelivery: 'Delivery shuru karo ({meals})',
  startQ: 'Delivery shuru karein?',
  startMsg: '{meals} "raste mein" dikhenge aur customers ko message jayega.',
  start: 'Shuru karo',
  startedToast: '{meals} raste mein — customers ko bata diya hai.',
  alreadyOnWay: 'Yahan sab pehle se raste mein hai.',
  startFail: 'Delivery shuru nahi hui.',
  list: 'List',
  map: 'Map',
  nearest: 'Sabse paas',
  openRoute: 'Google Maps mein route kholo',
  next10: ' (agle 10 stops)',
  noDeliveriesBatch: 'Is batch mein koi delivery nahi.',
  noPin: '{n} ka map pe pin nahi hai — list dekho.',
  doneHead: 'Ho gaye',
  allowLocation: 'Distance se lagane ke liye location allow karo.',
  sortedNoPin: 'Laga diye — bina pin wale {n} last mein hain.',
  sorted: 'Aapse distance ke hisaab se laga diye.',
  locationFail: 'Location nahi mili — bahar jaake dobara try karo.',
  saveOrderFail: 'Order save nahi hua.',
  loadStopsFail: 'Stops load nahi hue.',
  moveUp: 'Upar karo',
  moveDown: 'Neeche karo',
  onTheWay: 'Raste mein · customer ko bata diya',
  reported: 'Bataya: {issue}. Office decide karega — aap ab bhi delivered mark kar sakte ho.',
  note: 'Note: {note}',
  cashReported: '{amount} bataya',
  collectCash: '{amount} cash lo',
  change: 'Badlo',
  cashCollected: 'Cash mil gaya',
  go: 'Chalo',
  call: 'Call',
  whatsapp: 'WhatsApp',
  delivered: 'Delivered',
  problem: 'Problem',
  deliveredAt: '{time} pe delivered',
  notToday: 'Aaj delivery nahi',
  cashBtn: 'Cash {amount}',
  handOver: '{name} ko de diya?',
  remindCash: '{amount} cash lena yaad rakho.',
  addPhoto: 'Photo add karo (zaroori nahi)',
  retakePhoto: 'Photo dobara lo',
  removePhoto: 'Photo hatao',
  cameraDenied: 'Photo ke liye settings mein camera allow karo.',
  markDelivered: 'Delivered mark karo',
  walletShort: 'Customer ke wallet mein paise kam hain — ye meal bill nahi hua aur unhe bata diya hai. Dene se pehle office ko call karo.',
  deliveredToast: '{name} — delivered ✓',
  photoUploadFail: 'Photo upload nahi hui — dobara try karo, ya photo hata ke deliver karo.',
  couldntDeliver: '{name} ko deliver nahi ho paya?',
  problemHelp: 'Pehle customer ko call karo. Phir bhi na de pao to office ko wajah batao — office ke decide karne tak meal ka paisa nahi katega.',
  anythingElse: 'Kuch aur? (zaroori nahi)',
  pickReason: 'Koi wajah chuno.',
  reportToOffice: 'Office ko batao',
  reportedToast: 'Bata diya — office dekh lega. Baad mein bhi delivered mark kar sakte ho.',
  cashFrom: '{name} se cash',
  cashHelp: 'Baaki: {amount}. Jitna asal mein mila wo likho — cash dene pe office record karega.',
  amountCollected: 'Mila hua amount',
  cashNote: 'Note (zaroori nahi) — jaise aadha diya, baaki kal',
  enterAmount: 'Jitna mila wo amount likho.',
  reportCash: 'Cash milne ki report karo',
  cashToast: '{amount} bata diya — office ko de do.',
  offline: 'Internet nahi hai — connection check karo.',
  tryAgain: 'Dobara try karo',
  notifications: 'Notifications',
  noNotifications: 'Abhi koi notification nahi.',
  language: 'Bhasha',
  menu: 'Menu',
  back: 'Wapas',
  refresh: 'Refresh',
  close: 'Band karo',
  reason_notAnswering: 'Phone nahi utha rahe',
  reason_wrongAddress: 'Galat address',
  reason_refused: 'Customer ne mana kiya',
  reason_noOneHome: 'Ghar pe koi nahi / gate band',
  reason_other: 'Kuch aur',
}

const DICT: Record<Lang, Record<Key, string>> = { en, hi, hinglish }

// The reasons go to the office in English (the admin and the database's
// partner_report_problem list); they're only shown translated.
export const REASON_KEYS: Record<string, Key> = {
  'Not answering': 'reason_notAnswering',
  'Wrong address': 'reason_wrongAddress',
  'Customer refused': 'reason_refused',
  'No one home / gate locked': 'reason_noOneHome',
  Other: 'reason_other',
}

// Server messages (English) the app knows how to say in the other languages.
const SERVER_MESSAGES: Record<string, Key> = {
  [en.errBatchNotYours]: 'errBatchNotYours',
  [en.errRefresh]: 'errRefresh',
  [en.errPhoto]: 'errPhoto',
  [en.errStopDone]: 'errStopDone',
  [en.errNoCash]: 'errNoCash',
  [en.enterAmount]: 'enterAmount',
  [en.pickReason]: 'pickReason',
  [en.errSignInAgain]: 'errSignInAgain',
  'Not signed in as a delivery partner.': 'errSignInAgain',
  [en.errNoInternet]: 'errNoInternet',
  [en.photoUploadFail]: 'photoUploadFail',
}

export type T = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key, vars?: Record<string, string | number>) => string
  // "1 stop" / "3 stops"
  count: (one: Key, many: Key, n: number) => string
  // A server/Error message, in the chosen language when the app knows it.
  error: (e: unknown) => string
  // A stored problem ("Not answering — gate locked"), reason translated.
  issue: (text: string) => string
  locale: string
}

const STORE_KEY = 'gf-partner-lang'
const LangContext = createContext<T | null>(null)

function fill(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (whole, k: string) => (k in vars ? String(vars[k]) : whole))
}

export function LanguageProvider({ children, onChange }: { children: React.ReactNode; onChange?: (l: Lang) => void }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((v) => {
        if (v === 'en' || v === 'hi' || v === 'hinglish') setLangState(v)
      })
      .catch(() => {})
  }, [])

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l)
      AsyncStorage.setItem(STORE_KEY, l).catch(() => {})
      onChange?.(l)
    },
    [onChange]
  )

  const value = useMemo<T>(() => {
    const dict = DICT[lang]
    const t = (key: Key, vars?: Record<string, string | number>) => fill(dict[key] ?? en[key], vars)
    return {
      lang,
      setLang,
      t,
      count: (one, many, n) => (n === 1 ? t(one) : t(many, { n })),
      error: (e) => {
        const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
        const key = SERVER_MESSAGES[msg]
        return key ? t(key) : msg || t('genericError')
      },
      issue: (text) => {
        const [reason, ...rest] = text.split(' — ')
        const key = REASON_KEYS[reason]
        return key ? [t(key), ...rest].join(' — ') : text
      },
      locale: lang === 'hi' ? 'hi-IN' : 'en-IN',
    }
  }, [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useT() {
  const v = useContext(LangContext)
  if (!v) throw new Error('useT outside LanguageProvider')
  return v
}

// The phone's saved choice, if any (to tell a fresh install from a choice).
export async function storedLang(): Promise<Lang | null> {
  try {
    const v = await AsyncStorage.getItem(STORE_KEY)
    return v === 'en' || v === 'hi' || v === 'hinglish' ? v : null
  } catch {
    return null
  }
}
