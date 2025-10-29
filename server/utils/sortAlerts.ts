import { isDateAndInThePast } from './utils'
import { Alert } from '../data/alertsApiTypes'

/**
 * Sorts an array of alerts according to business rules:
 *  1. Active alerts (not expired) appear before expired alerts.
 *  2. Among active alerts → sort by activeFrom (newest first).
 *  3. Among expired alerts → sort by activeTo (most recent expiry first).
 *  4. If still equal → sort by createdAt (newest first).
 */
function sortAlerts(alerts: Alert[] = []): Alert[] {
  return alerts.sort((a, b) => {
    const aExpired = isDateAndInThePast(a.activeTo)
    const bExpired = isDateAndInThePast(b.activeTo)

    // 1️⃣ Active alerts before expired ones
    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1
    }

    // Helper to safely convert date strings → timestamps
    const toTime = (date?: string | null): number => (date ? new Date(date).getTime() : 0)

    // 2️⃣ If both are active → sort by activeFrom (newest first)
    if (!aExpired && a.activeFrom !== b.activeFrom) {
      return toTime(b.activeFrom) - toTime(a.activeFrom)
    }

    // 3️⃣ If both are expired → sort by activeTo (most recent expiry first)
    if (aExpired && a.activeTo !== b.activeTo) {
      return toTime(b.activeTo) - toTime(a.activeTo)
    }

    // 4️⃣ Fallback → sort by createdAt (newest first)
    return toTime(b.createdAt) - toTime(a.createdAt)
  })
}

export default sortAlerts
