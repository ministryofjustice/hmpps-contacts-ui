import { format, formatDistanceStrict, isValid, parseISO } from 'date-fns'
import DateOfBirth = journeys.DateOfBirth

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const capitaliseName = (name: string) => {
  return isBlank(name) ? '' : name.toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase())
}

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const prisonerDatePretty = ({
  dateToFormat,
  wrapDate = true,
}: {
  dateToFormat: string
  wrapDate?: boolean
}): string => {
  if (wrapDate) {
    return format(parseISO(dateToFormat), 'd MMMM yyyy')
  }

  return `<span class="bapv-table_cell--nowrap">${format(parseISO(dateToFormat), 'd MMMM')}</span> ${format(
    parseISO(dateToFormat),
    'yyyy',
  )}`
}

export const formatDate = (date: string | Date, fmt = 'd MMMM yyyy') => {
  if (!date) return undefined
  const richDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(richDate)) return undefined
  return format(richDate, fmt)
}

export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const extractPrisonerNumber = (search: string): string | false => {
  const searchTerms = search?.toUpperCase().split(' ')
  return (searchTerms && searchTerms.find(term => isValidPrisonerNumber(term))) || false
}

export const getFormatDistanceToNow = (date: Date) => {
  return formatDistanceStrict(date, new Date(), { roundingMethod: 'floor' })
}

export const formatDateForApi = (dateOfBirth: Partial<DateOfBirth>) => {
  if (dateOfBirth.year && dateOfBirth.month && dateOfBirth.day) {
    const day = String(dateOfBirth.day).padStart(2, '0')
    const month = String(dateOfBirth.month).padStart(2, '0')
    return `${dateOfBirth.year}-${month}-${day}`
  }
  return null
}

export const capitalizeFirstLetter = (val: string) => {
  return val.toLowerCase().replace(/^./, val[0].toUpperCase())
}
