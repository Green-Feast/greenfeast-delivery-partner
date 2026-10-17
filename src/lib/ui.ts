import { Alert, Platform } from 'react-native'

export const C = {
  green: '#1B5E20',
  greenSoft: '#E8F5E9',
  bg: '#F9FBF7',
  card: '#FFFFFF',
  border: '#E2E8D5',
  text: '#1A1A1A',
  muted: '#6B7280',
  faint: '#9CA3AF',
  red: '#DC2626',
  redDark: '#991B1B',
  redSoft: '#FEF2F2',
  redBorder: '#FECACA',
  amber: '#92400E',
  amberSoft: '#FFFBEB',
  amberButton: '#F59E0B',
  blue: '#1D4ED8',
  noteBg: '#FEFCE8',
  noteText: '#713F12',
  grey: '#F3F4F6',
}

// Why a partner couldn't hand a meal over. Same list as
// partner_report_problem() in the database (migration 060).
export const PROBLEM_REASONS = ['Not answering', 'Wrong address', 'Customer refused', 'No one home / gate locked', 'Other'] as const

// Yes/no question that works on phones and on the web.
export function confirm(title: string, message: string, ok = 'OK'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`))
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: ok, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  )
}
