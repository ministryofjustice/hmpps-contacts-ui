import ReferenceCodeType from '../../enumeration/referenceCodeType'
import { HmppsUser } from '../../interfaces/hmppsUser'

type StubReferenceData = { code: string; description: string; groupCode: string }
const STUBBED_TITLE_OPTIONS: StubReferenceData[] = [
  { code: 'DAME', description: 'Dame', groupCode: 'TITLE' },
  { code: 'FR', description: 'Father', groupCode: 'TITLE' },
  { code: 'LORD', description: 'Lord', groupCode: 'TITLE' },
  { code: 'MS', description: 'Ms', groupCode: 'TITLE' },
  { code: 'RABBI', description: 'Rabbi', groupCode: 'TITLE' },
  { code: 'REV', description: 'Reverend', groupCode: 'TITLE' },
  { code: 'SIR', description: 'Sir', groupCode: 'TITLE' },
  { code: 'SR', description: 'Sister', groupCode: 'TITLE' },
  { code: 'MR', description: 'Mr', groupCode: 'TITLE' },
  { code: 'BR', description: 'Brother', groupCode: 'TITLE' },
  { code: 'DR', description: 'Dr', groupCode: 'TITLE' },
  { code: 'LADY', description: 'Lady', groupCode: 'TITLE' },
  { code: 'MISS', description: 'Miss', groupCode: 'TITLE' },
  { code: 'MRS', description: 'Mrs', groupCode: 'TITLE' },
  { code: 'IMAM', description: 'Imam', groupCode: 'TITLE' },
]

const STUBBED_RELATIONSHIP_OPTIONS: StubReferenceData[] = [
  { code: 'MOT', description: 'Mother', groupCode: 'RELATIONSHIP' },
  { code: 'FA', description: 'Father', groupCode: 'RELATIONSHIP' },
  { code: 'DAU', description: 'Daughter', groupCode: 'RELATIONSHIP' },
  { code: 'SON', description: 'Son', groupCode: 'RELATIONSHIP' },
  { code: 'WIFE', description: 'Wife', groupCode: 'RELATIONSHIP' },
  { code: 'FOO', description: 'ZZZ Alphabetically Last', groupCode: 'RELATIONSHIP' },
  { code: 'HUS', description: 'Husband', groupCode: 'RELATIONSHIP' },
  { code: 'OTHER', description: 'Other - Social', groupCode: 'RELATIONSHIP' },
  { code: 'NONE', description: 'None', groupCode: 'RELATIONSHIP' },
  { code: 'ILP', description: 'In Loco Parentes', groupCode: 'RELATIONSHIP' },
]
const STUBBED_PHONE_TYPE_OPTIONS: StubReferenceData[] = [
  { code: 'MOB', description: 'Mobile phone', groupCode: 'PHONE_TYPE' },
  { code: 'HOME', description: 'Home phone', groupCode: 'PHONE_TYPE' },
]

type StubLanguageData = {
  languageId: number
  nomisCode: string
  nomisDescription: string
  isoAlpha2: string
  isoAlpha3: string
  isoLanguageDesc: string
  displaySequence: number
}

const STUBBED_LANGUAGE_OPTIONS: StubLanguageData[] = [
  {
    languageId: 1,
    nomisCode: 'ALB',
    nomisDescription: 'Albanian',
    isoAlpha2: 'sq',
    isoAlpha3: 'alb',
    isoLanguageDesc: 'Albanian',
    displaySequence: 2,
  },
  {
    languageId: 2,
    nomisCode: 'AMH',
    nomisDescription: 'Amharic',
    isoAlpha2: 'am',
    isoAlpha3: 'amh',
    isoLanguageDesc: 'Amharic',
    displaySequence: 99,
  },
  {
    languageId: 3,
    nomisCode: 'ARA',
    nomisDescription: 'Arabic',
    isoAlpha2: 'ar',
    isoAlpha3: 'ara',
    isoLanguageDesc: 'Arabic',
    displaySequence: 2,
  },
]

const mockedReferenceData = (type: ReferenceCodeType, _: HmppsUser): Promise<StubReferenceData[]> => {
  if (type === ReferenceCodeType.TITLE) {
    return Promise.resolve(STUBBED_TITLE_OPTIONS)
  }
  if (type === ReferenceCodeType.RELATIONSHIP) {
    return Promise.resolve(STUBBED_RELATIONSHIP_OPTIONS)
  }
  if (type === ReferenceCodeType.PHONE_TYPE) {
    return Promise.resolve(STUBBED_PHONE_TYPE_OPTIONS)
  }
  return Promise.reject(new Error(`You haven't set up the stubbed reference data for ${type} yet`))
}

export {
  mockedReferenceData,
  STUBBED_TITLE_OPTIONS,
  STUBBED_RELATIONSHIP_OPTIONS,
  STUBBED_LANGUAGE_OPTIONS,
  STUBBED_PHONE_TYPE_OPTIONS,
}
