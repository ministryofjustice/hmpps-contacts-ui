import { format, isValid, parseISO } from 'date-fns'
import DateOfBirth = journeys.DateOfBirth

const isBlank = (str?: string): boolean => !str || /^\s*$/.test(str)

export const capitaliseName = (name?: string) => {
  return isBlank(name) ? '' : name!.toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase())
}

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0]![0]}. ${array.reverse()[0]!}`
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

export const formatDate = (date?: string | Date, fmt = 'd MMMM yyyy') => {
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

export const extractPrisonerNumber = (search?: string): string | false => {
  const searchTerms = search?.toUpperCase().split(' ')
  return (searchTerms && searchTerms.find(term => isValidPrisonerNumber(term))) || false
}

export const ageInYears = (date: string | Date, now: Date = new Date()) => {
  const dateOfBirth = new Date(date)
  let age = now.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = now.getMonth() - dateOfBirth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1
  }
  if (age === 1) {
    return '1 year'
  }
  return `${age} years`
}

export const formatDateForApi = (dateOfBirth?: Partial<DateOfBirth>) => {
  if (dateOfBirth && dateOfBirth.year && dateOfBirth.month && dateOfBirth.day) {
    const day = String(dateOfBirth.day).padStart(2, '0')
    const month = String(dateOfBirth.month).padStart(2, '0')
    return `${dateOfBirth.year}-${month}-${day}`
  }
  return null
}

export const capitalizeFirstLetter = (val: string) => {
  return val && val.toLowerCase().replace(/^./, val[0]!.toUpperCase())
}

// add aria-sort attributes to govukTable head row, so that moj-sortable-table css will be applied
export const convertToSortableColumns = (headings: { text: string; key?: string }[], sort: string) => {
  const [sortingKey, sortingDirection] = sort.split(',')

  return headings.map(heading => {
    if (!heading.key) {
      return heading
    }
    if (heading.key === sortingKey) {
      if (sortingDirection === 'asc') {
        return {
          attributes: {
            'aria-sort': 'ascending',
          },
          html: `<a href="?sort=${heading.key},desc"><button>${heading.text}</button></a>`,
        }
      }
      if (sortingDirection === 'desc') {
        return {
          attributes: {
            'aria-sort': 'descending',
          },
          html: `<a href="?sort=${heading.key},asc"><button>${heading.text}</button></a>`,
        }
      }
    }
    return {
      attributes: {
        'aria-sort': 'none',
      },
      html: `<a href="?sort=${heading.key},asc"><button>${heading.text}</button></a>`,
    }
  })
}

const isLowerCase = (val: string): boolean => /^[a-z]*$/.test(val)

const lowercaseExceptAcronym = (val: string): string => {
  if (val.includes('-')) {
    return val
      .split('-')
      .map(part => (Array.from(part).some(isLowerCase) ? part.toLowerCase() : part))
      .join('-')
  }

  if (val.length < 2 || Array.from(val).some(isLowerCase)) {
    return val.toLowerCase()
  }
  return val
}

export const sentenceCase = (val: string, startsWithUppercase: boolean = true): string => {
  const words = val.split(/\s+/)
  const sentence = words.map(lowercaseExceptAcronym).join(' ')
  return startsWithUppercase ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : sentence
}

export const isDateAndInThePast = (date?: string): boolean => {
  if (date) {
    const expirationDate = new Date(date)
    return expirationDate.getTime() < new Date().getTime()
  }
  return false
}
