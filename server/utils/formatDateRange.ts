import { formatDate } from './utils'

export const formatDateRange = ({
  startDate,
  endDate,
  fromMonth,
  fromYear,
  toMonth,
  toYear,
}: {
  startDate?: string | undefined
  endDate?: string | undefined
  fromMonth?: string | undefined
  fromYear?: string | undefined
  toMonth?: string | undefined
  toYear?: string | undefined
}) => {
  if (startDate && endDate) {
    return `From ${formatDate(startDate, 'MMMM yyyy')} to ${formatDate(endDate, 'MMMM yyyy')}`
  }
  if (startDate) {
    return `From ${formatDate(startDate, 'MMMM yyyy')}`
  }
  if (fromMonth && fromYear && toMonth && toYear) {
    return `From ${formatDate(new Date(`${fromYear}-${fromMonth}-01Z`), 'MMMM yyyy')} to ${formatDate(new Date(`${toYear}-${toMonth}-01Z`), 'MMMM yyyy')}`
  }
  if (fromMonth && fromYear) {
    return `From ${formatDate(new Date(`${fromYear}-${fromMonth}-01Z`), 'MMMM yyyy')}`
  }
  return null
}
