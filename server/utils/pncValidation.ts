/**
 * The following was adapted to typescript from hmpps-person-record's PNC data model
 * https://github.com/ministryofjustice/hmpps-person-record/blob/main/src/main/kotlin/uk/gov/justice/digital/hmpps/personrecord/model/identifiers/PNCIdentifier.kt
 */
const SERIAL_NUM_LENGTH = 7
const YEAR_END = 4

const PNC_REGEX = `\\d{2,${YEAR_END}}(/?)\\d{1,${SERIAL_NUM_LENGTH}}[A-Z]$`

const SLASH = '/'
const LONG_PNC_ID_LENGTH = 10
const CENTURY = 100
const VALID_LETTERS = 'ZABCDEFGHJKLMNPQRTUVWXY'

type ParsedPNC = { checkChar: string; serialNum: string; yearDigits: string }

function isExpectedFormat(value: string) {
  return value.match(PNC_REGEX)
}

const isShortFormFormat = (pnc: string) => pnc.length < LONG_PNC_ID_LENGTH

const currentYearLastTwoDigits = (): number => new Date().getFullYear() % CENTURY

function isYearLastCentury(year: number): boolean {
  return year > currentYearLastTwoDigits() && year <= CENTURY
}

function isYearThisCentury(year: number): boolean {
  return year >= 0 && year <= currentYearLastTwoDigits()
}

function getYearFromLastTwoDigits(year: number): string {
  if (isYearThisCentury(year)) {
    return `20${year.toString().padStart(2, '0')}`
  }
  if (isYearLastCentury(year)) {
    return `19${year.toString().padStart(2, '0')}`
  }
  throw Error(`Can't parse century from year (${year})`)
}

function canonicalShortForm(pnc: string): ParsedPNC {
  const checkChar = pnc.substring(pnc.length - 1)
  const year = getYearFromLastTwoDigits(Number(pnc.substring(0, 2))) // E.g. 79 becomes 1979
  const serialNum = pnc.substring(2, pnc.length - 1) // the non-year id part 123456Z
  return { checkChar, serialNum, yearDigits: year }
}

function canonicalLongForm(pnc: string): ParsedPNC {
  const checkChar = pnc.substring(pnc.length - 1)
  const year = pnc.substring(0, YEAR_END)
  const serialNum = pnc.substring(0, pnc.length - 1).substring(pnc.length - SERIAL_NUM_LENGTH - 1)
  return { checkChar, serialNum, yearDigits: year }
}

function toCanonicalForm(value: string): ParsedPNC {
  const sanitizedPncId = value.replace(SLASH, '')
  let canonicalPnc
  if (isShortFormFormat(sanitizedPncId)) {
    canonicalPnc = canonicalShortForm(sanitizedPncId)
  } else {
    canonicalPnc = canonicalLongForm(sanitizedPncId)
  }
  return canonicalPnc
}

function isValid(parsedPNC: ParsedPNC): boolean {
  const paddedSerialNum = parsedPNC.serialNum.padStart(SERIAL_NUM_LENGTH, '0')
  const checksumValue = Number(parsedPNC.yearDigits.substring(2) + paddedSerialNum)
  const expectedCheckChar = VALID_LETTERS.charAt(checksumValue % VALID_LETTERS.length)
  return parsedPNC.checkChar === expectedCheckChar
}

export default function isValidPNC(value?: string): boolean {
  if (!value) {
    return false
  }
  if (!isExpectedFormat(value)) {
    return false
  }
  return isValid(toCanonicalForm(value))
}
