import { format } from 'date-fns'
import {
  formatDate,
  initialiseName,
  prisonerDatePretty,
  isValidPrisonerNumber,
  extractPrisonerNumber,
  formatDateForApi,
  capitalizeFirstLetter,
  capitaliseName,
  ageInYears,
  isDateAndInThePast,
  formatDob,
} from './utils'
import { ContactSearchResultItem } from '../@types/contactsApiClient'

describe('convert to title case', () => {
  it.each([
    [null, undefined, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
    ['Otherwise punctuated', "billy-bob o'reilly jr.", "Billy-Bob O'Reilly Jr."],
  ])('%s capitaliseName(%s, %s)', (_, a, expected) => {
    expect(capitaliseName(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, undefined, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_, a, expected) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('Prisoner Date Pretty', () => {
  it('shuould format date to dd MMMM YYYY', () => {
    const fullName = prisonerDatePretty({ dateToFormat: '1981-01-30' })

    expect(fullName).toEqual('30 January 1981')
  })
})

describe('Format date', () => {
  it.each([
    [null, undefined, 'd MMMM yyyy', undefined],
    ['empty string', '', 'd MMMM yyyy', undefined],
    ['Poor format string', '20-03-2022', 'd MMMM yyyy', undefined],
    ['ISO Date String', '2022-03-20', 'd MMMM yyyy', '20 March 2022'],
    ['Date Object', new Date(2022, 2, 20), 'd MMMM yyyy', '20 March 2022'],
  ])('%s formatDate(%s, %s)', (_, a, fmt, expected) => {
    expect(formatDate(a, fmt)).toEqual(expected)
  })
})

describe('isValidPrisonerNumber', () => {
  it('valid', () => {
    expect(isValidPrisonerNumber('A1234BC')).toEqual(true)
  })
  it('invalid', () => {
    expect(isValidPrisonerNumber('AB1234C')).toEqual(false)
  })
  it('empty string', () => {
    expect(isValidPrisonerNumber('')).toEqual(false)
  })
  it('disallowed characters', () => {
    expect(isValidPrisonerNumber(' A1234BC-')).toEqual(false)
  })
  it('wrong case', () => {
    expect(isValidPrisonerNumber('A1234bC')).toEqual(false)
  })
})

describe('extractPrisonerNumber', () => {
  it.each([
    ['valid prisoner number', 'A1234BC', 'A1234BC'],
    ['valid prisoner number (lowercase)', 'a1234bc', 'A1234BC'],
    ['valid prisoner number (within string)', 'name A1234BC name', 'A1234BC'],
    ['do not match a sub-string', 'nameA1234BCname', false],
    ['empty string', '', false],
    ['disallowed characters', 'A123-4BC', false],
    ['wrong format', '1ABCD23', false],
    ['null string', undefined, false],
  ])('%s: extractPrisonerNumber(%s) => %s', (_, input, expected) => {
    expect(extractPrisonerNumber(input)).toEqual(expected)
  })
})

describe('formatDateForApi', () => {
  it('should return date in YYYY-MM-DD format', () => {
    // Given
    const dateOfBirth = {
      year: 2000,
      month: 11,
      day: 1,
    }

    // When
    const results = formatDateForApi(dateOfBirth)

    // Then
    expect(results).toEqual('2000-11-01')
  })
})

describe('capitalizeFirstLetter', () => {
  it('should return string with the first letter capitilized', () => {
    // Given
    const val = 'TEST'

    // When
    const results = capitalizeFirstLetter(val)

    // Then
    expect(results).toEqual('Test')
  })
})

describe('ageInYears', () => {
  it.each([
    ['1973-01-10', '2025-01-06', '51 years'],
    ['1982-06-15', '2024-12-25', '42 years'],
    ['2024-01-01', '2025-01-01', '1 year'],
    ['2024-01-02', '2025-01-01', 'Less than a year'],
    ['2024-02-29', '2025-02-28', 'Less than a year'],
    ['2024-02-29', '2025-03-01', '1 year'],
    ['2003-03-01', '2024-02-29', '20 years'],
    ['2003-02-28', '2024-02-29', '21 years'],
  ])(
    'should calculate years correctly with date input',
    (dateOfBirth: string, currentDate: string, expected: string) => {
      // Given
      const today = new Date(currentDate)

      // When
      const results = ageInYears(new Date(dateOfBirth), today)

      // Then
      expect(results).toEqual(expected)
    },
  )

  it.each([
    ['1973-01-10', '2025-01-06', '51 years'],
    ['1982-06-15', '2024-12-25', '42 years'],
    ['2024-01-01', '2025-01-01', '1 year'],
    ['2024-01-02', '2025-01-01', 'Less than a year'],
    ['2024-02-29', '2025-02-28', 'Less than a year'],
    ['2024-02-29', '2025-03-01', '1 year'],
    ['2003-03-01', '2024-02-29', '20 years'],
    ['2003-02-28', '2024-02-29', '21 years'],
  ])(
    'should calculate years correctly with string input',
    (dateOfBirth: string, currentDate: string, expected: string) => {
      // Given
      const today = new Date(currentDate)

      // When
      const results = ageInYears(dateOfBirth, today)

      // Then
      expect(results).toEqual(expected)
    },
  )

  it('should default to today for current date', () => {
    // Given
    const dateOfBirth = new Date()
    dateOfBirth.setDate(dateOfBirth.getDate() - (365 + 365 + 2))

    // When
    const results = ageInYears(dateOfBirth)

    // Then
    expect(results).toEqual('2 years')
  })
})

describe('isDateAndInThePast', () => {
  it('should be false if no end date is in the future', () => {
    expect(isDateAndInThePast(undefined)).toStrictEqual(false)
  })
  it('should be false if date is in the future', () => {
    expect(isDateAndInThePast('2029-01-01')).toStrictEqual(false)
  })
  it('should be true if date is in the past', () => {
    expect(isDateAndInThePast('2025-01-01')).toStrictEqual(true)
  })
})

describe('formatDob', () => {
  const halfYearAgo = new Date()
  halfYearAgo.setMonth(halfYearAgo.getMonth() - 5)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  oneYearAgo.setDate(oneYearAgo.getDate() - 1) // deduct a day so the test does not fail on 29-Feb
  const fiftyYearsAgo = new Date()
  fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50)
  fiftyYearsAgo.setDate(fiftyYearsAgo.getDate() - 1) // deduct a day so the test does not fail on 29-Feb

  it.each([
    [halfYearAgo, false, 'Less than a year old'],
    [halfYearAgo, true, 'Deceased'],
    [oneYearAgo, false, '1 year old'],
    [oneYearAgo, true, 'Deceased'],
    [fiftyYearsAgo, false, '50 years old'],
    [fiftyYearsAgo, true, 'Deceased'],
  ])(
    'should render Date of Birth label correctly with dateOfBirth and deceasedDate',
    (dateOfBirth: Date, deceased: boolean, expectedAgeLabel: string) => {
      // When
      const results = formatDob({
        dateOfBirth: dateOfBirth.toISOString().substring(0, 10),
        deceasedDate: deceased ? '1999-01-01' : undefined,
      } as ContactSearchResultItem)

      // Then
      expect(results).toEqual(
        `${format(dateOfBirth, 'd/M/yyyy')}<br/><span class="govuk-hint">(${expectedAgeLabel})</span>`,
      )
    },
  )

  it('should render Date of Birth label correctly with dateOfBirth undefined', () => {
    expect(formatDob({} as ContactSearchResultItem)).toEqual(`Not provided`)
  })

  it('should render Date of Birth label correctly with dateOfBirth undefined but with a deceased date', () => {
    expect(formatDob({ deceasedDate: '2010-01-01' } as ContactSearchResultItem)).toEqual(
      `Not provided<br/><span class="govuk-hint">(Deceased)</span>`,
    )
  })
})
