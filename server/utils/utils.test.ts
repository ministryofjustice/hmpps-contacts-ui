import {
  convertToTitleCase,
  formatDate,
  initialiseName,
  prisonerDatePretty,
  properCaseFullName,
  isValidPrisonerNumber,
  extractPrisonerNumber,
  formatDateForApi,
} from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('Proper Case Full Name', () => {
  it('shuould remove extra spaces at the end and capitalize name', () => {
    const fullName = properCaseFullName('ALANOINE, EHSHAPETER    ')

    expect(fullName).toEqual('Alanoine, Ehshapeter')
  })

  it('shuould remove extra spaces before and after and capitalize name', () => {
    const fullName = properCaseFullName('   ALANOINE, EHSHAPETER    ')

    expect(fullName).toEqual('Alanoine, Ehshapeter')
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
    [null, null, 'd MMMM yyyy', undefined],
    ['empty string', '', 'd MMMM yyyy', undefined],
    ['Poor format string', '20-03-2022', 'd MMMM yyyy', undefined],
    ['ISO Date String', '2022-03-20', 'd MMMM yyyy', '20 March 2022'],
    ['Date Object', new Date(2022, 2, 20), 'd MMMM yyyy', '20 March 2022'],
  ])('%s formatDate(%s, %s)', (_: string, a: string | Date, fmt: string, expected: string) => {
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
    ['null string', null, false],
  ])('%s: extractPrisonerNumber(%s) => %s', (_: string, input: string, expected: string | false) => {
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
    const results = formatDateForApi(JSON.stringify(dateOfBirth))

    // Then
    expect(results).toEqual('2000-11-1')
  })
})
