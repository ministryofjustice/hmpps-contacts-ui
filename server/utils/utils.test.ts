import {
  convertToTitleCase,
  formatDate,
  getResultsPagingLinks,
  initialiseName,
  prisonerDatePretty,
  properCaseFullName,
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

describe('Get results paging links', () => {
  it('should get paging links', () => {
    const parameters = {
      pagesToShow: 3,
      numberOfPages: 3,
      currentPage: 1,
      searchParam: 'search=Al',
      searchUrl: '/search/prisoner',
    }
    const fullName = getResultsPagingLinks(parameters)

    expect(fullName).toEqual([
      { href: '/search/prisoner?search=Al&page=1', selected: true, text: '1' },
      { href: '/search/prisoner?search=Al&page=2', selected: false, text: '2' },
      { href: '/search/prisoner?search=Al&page=3', selected: false, text: '3' },
    ])
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
