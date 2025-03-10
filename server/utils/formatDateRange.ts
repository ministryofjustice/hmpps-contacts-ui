import { formatDate } from './utils'

export const formatDateRange = ({
  startDate,
  endDate,
}: {
  startDate?: string | undefined
  endDate?: string | undefined
}) => {
  if (startDate && endDate) {
    return `From ${formatDate(startDate, 'MMMM yyyy')} to ${formatDate(endDate, 'MMMM yyyy')}`
  }
  if (startDate) {
    return `From ${formatDate(startDate, 'MMMM yyyy')}`
  }
  return null
}
