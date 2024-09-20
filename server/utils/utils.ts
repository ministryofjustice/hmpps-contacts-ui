import { format, formatDistanceStrict, isValid, parseISO } from 'date-fns'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const properCaseFullName = (name: string): string =>
  isBlank(name)
    ? ''
    : name
        .split(/(\s+)/)
        .filter(s => s.trim().length)
        .map(properCaseName)
        .join(' ')

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
  return formatDistanceStrict(date, new Date())
}

export const formatDateForApi = (dateOfBirth: string) => {
  const date = JSON.parse(dateOfBirth)
  if (date.year && date.month && date.day) {
    return `${date.year}-${date.month}-${date.day}`
  }
  return null
}

export const isContactListed = (
  content: Array<Record<string, string>>,
  journey: journeys.ManageContactsJourney,
): boolean => {
  return content.some(
    (item: Record<string, string>) =>
      item.lastName === journey?.searchContact?.contact.lastName ||
      item.firstName === journey?.searchContact?.contact.firstName ||
      item.lastName.toLocaleUpperCase() === journey?.searchContact?.contact.lastName ||
      item.lastName.toLocaleLowerCase() === journey?.searchContact?.contact.lastName ||
      item.middleName.toLocaleUpperCase() === journey?.searchContact?.contact.middleName ||
      item.middleName.toLocaleLowerCase() === journey?.searchContact?.contact.middleName ||
      item.firstName.toLocaleUpperCase() === journey?.searchContact?.contact.firstName ||
      item.firstName.toLocaleLowerCase() === journey?.searchContact?.contact.firstName,
  )
}
