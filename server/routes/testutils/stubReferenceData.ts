import ReferenceCodeType from '../../enumeration/referenceCodeType'

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

const STUBBED_SOCIAL_RELATIONSHIP_OPTIONS: StubReferenceData[] = [
  { code: 'MOT', description: 'Mother', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'FA', description: 'Father', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'DAU', description: 'Daughter', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'SON', description: 'Son', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'WIFE', description: 'Wife', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'HUS', description: 'Husband', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'OTHER', description: 'Other - Social', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'NONE', description: 'None', groupCode: 'SOCIAL_RELATIONSHIP' },
  { code: 'ILP', description: 'In Loco Parentes', groupCode: 'SOCIAL_RELATIONSHIP' },
]

const STUBBED_OFFICIAL_RELATIONSHIP_OPTIONS: StubReferenceData[] = [
  { code: 'CA', description: 'Case Administrator', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'COM', description: 'Community Offender Manager', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'CUSPO', description: 'CuSP Officer', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'DART', description: 'Drug Worker (DART)', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'DR', description: 'Doctor', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'FLO', description: 'Family Liaison Officer', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'FW', description: 'Family worker', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'IMAM', description: 'Imam', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'LAC', description: 'Local Authority Contact', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'OFS', description: 'Offender Supervisor', groupCode: 'OFFICIAL_RELATIONSHIP' },
  { code: 'OTH', description: 'Other - Official', groupCode: 'OFFICIAL_RELATIONSHIP' },
]
const STUBBED_RELATIONSHIP_TYPE_OPTIONS: StubReferenceData[] = [
  { code: 'S', description: 'Social', groupCode: 'RELATIONSHIP_TYPE' },
  { code: 'O', description: 'Official', groupCode: 'RELATIONSHIP_TYPE' },
]

const STUBBED_PHONE_TYPE_OPTIONS: StubReferenceData[] = [
  { code: 'MOB', description: 'Mobile', groupCode: 'PHONE_TYPE' },
  { code: 'HOME', description: 'Home', groupCode: 'PHONE_TYPE' },
]
const STUBBED_IDENTITY_OPTIONS: StubReferenceData[] = [
  { code: 'DL', description: 'Driving licence', groupCode: 'ID_TYPE' },
  { code: 'PASS', description: 'Passport number', groupCode: 'ID_TYPE' },
  { code: 'NINO', description: 'National insurance number', groupCode: 'ID_TYPE' },
]

const STUBBED_LANGUAGE_OPTIONS: StubReferenceData[] = [
  {
    code: 'ALB',
    description: 'Albanian',
    groupCode: 'LANGUAGE',
  },
  {
    code: 'AMH',
    description: 'Amharic',
    groupCode: 'LANGUAGE',
  },
  {
    code: 'ARA',
    description: 'Arabic',
    groupCode: 'LANGUAGE',
  },
]
const STUBBED_RESTRICTION_OPTIONS: StubReferenceData[] = [
  {
    code: 'ACC',
    description: 'Access Requirements',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'BAN',
    description: 'Banned',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'CCTV',
    description: 'CCTV',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'CHILD',
    description: 'Child Visitors to be Vetted',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'CLOSED',
    description: 'Closed',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'DIHCON',
    description: 'Disability Health Concerns',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'NONCON',
    description: 'Non-Contact Visit',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'PREINF',
    description: 'Previous Info',
    groupCode: 'RESTRICTION',
  },
  {
    code: 'RESTRICTED',
    description: 'Restricted',
    groupCode: 'RESTRICTION',
  },
]

const STUBBED_ADDRESS_TYPE_OPTIONS: StubReferenceData[] = [
  {
    code: 'HOME',
    description: 'Home address',
    groupCode: 'ADDRESS_TYPE',
  },
  {
    code: 'WORK',
    description: 'Work address',
    groupCode: 'ADDRESS_TYPE',
  },
  {
    code: 'BUS',
    description: 'Business address',
    groupCode: 'ADDRESS_TYPE',
  },
]

type StubStatusData = {
  referenceCodeId: number
  displayOrder: number
}

const STUBBED_DOMESTIC_STATUS_OPTIONS: StubReferenceData[] & StubStatusData[] = [
  {
    referenceCodeId: 3,
    groupCode: 'DOMESTIC_STS',
    code: 'S',
    description: 'Single-not married/in civil partnership',
    displayOrder: 1,
  },
  {
    referenceCodeId: 4,
    groupCode: 'DOMESTIC_STS',
    code: 'C',
    description: 'Co-habiting (living with partner)',
    displayOrder: 2,
  },
  {
    referenceCodeId: 5,
    groupCode: 'DOMESTIC_STS',
    code: 'M',
    description: 'Married or in civil partnership',
    displayOrder: 3,
  },
  {
    referenceCodeId: 6,
    groupCode: 'DOMESTIC_STS',
    code: 'D',
    description: 'Divorced or dissolved',
    displayOrder: 4,
  },
  {
    referenceCodeId: 7,
    groupCode: 'DOMESTIC_STS',
    code: 'P',
    description: 'Separated-not living with legal partner',
    displayOrder: 5,
  },
  {
    referenceCodeId: 8,
    groupCode: 'DOMESTIC_STS',
    code: 'W',
    description: 'Widowed',
    displayOrder: 6,
  },
  {
    referenceCodeId: 9,
    groupCode: 'DOMESTIC_STS',
    code: 'N',
    description: 'Prefer not to say',
    displayOrder: 7,
  },
]

const STUBBED_GENDER_OPTIONS: StubReferenceData[] & StubStatusData[] = [
  {
    referenceCodeId: 125,
    groupCode: 'GENDER',
    code: 'M',
    description: 'Male',
    displayOrder: 1,
    isActive: true,
  },
  {
    referenceCodeId: 126,
    groupCode: 'GENDER',
    code: 'F',
    description: 'Female',
    displayOrder: 2,
    isActive: true,
  },
  {
    referenceCodeId: 127,
    groupCode: 'GENDER',
    code: 'NK',
    description: 'Not Known / Not Recorded',
    displayOrder: 3,
    isActive: true,
  },
  {
    referenceCodeId: 128,
    groupCode: 'GENDER',
    code: 'NS',
    description: 'Not Specified (Indeterminate)',
    displayOrder: 4,
    isActive: true,
  },
]

const STUBBED_CITY_OPTIONS: StubReferenceData[] = [
  {
    code: '7375',
    description: 'Exeter',
    groupCode: 'CITY',
  },
  {
    code: '7521',
    description: 'Ilfracombe',
    groupCode: 'CITY',
  },
  {
    code: '25343',
    description: 'Sheffield',
    groupCode: 'CITY',
  },
]

const STUBBED_COUNTY_OPTIONS: StubReferenceData[] = [
  {
    code: 'DEVON',
    description: 'Devon',
    groupCode: 'COUNTY',
  },
  {
    code: 'S.YORKSHIRE',
    description: 'South Yorkshire',
    groupCode: 'COUNTY',
  },
  {
    code: 'W.SUSSEX',
    description: 'West Sussex',
    groupCode: 'COUNTY',
  },
]

const STUBBED_COUNTRY_OPTIONS: StubReferenceData[] = [
  {
    code: 'ENG',
    description: 'England',
    groupCode: 'COUNTRY',
  },
  {
    code: 'WALES',
    description: 'Wales',
    groupCode: 'COUNTRY',
  },
  {
    code: 'SCOT',
    description: 'Scotland',
    groupCode: 'COUNTRY',
  },
  {
    code: 'NI',
    description: 'Northern Ireland',
    groupCode: 'COUNTRY',
  },
]

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const mockedReferenceData = (type: ReferenceCodeType, _: Express.User): Promise<StubReferenceData[]> => {
  if (type === ReferenceCodeType.TITLE) {
    return Promise.resolve(STUBBED_TITLE_OPTIONS)
  }
  if (type === ReferenceCodeType.SOCIAL_RELATIONSHIP) {
    return Promise.resolve(STUBBED_SOCIAL_RELATIONSHIP_OPTIONS)
  }
  if (type === ReferenceCodeType.OFFICIAL_RELATIONSHIP) {
    return Promise.resolve(STUBBED_OFFICIAL_RELATIONSHIP_OPTIONS)
  }
  if (type === ReferenceCodeType.PHONE_TYPE) {
    return Promise.resolve(STUBBED_PHONE_TYPE_OPTIONS)
  }
  if (type === ReferenceCodeType.DOMESTIC_STS) {
    return Promise.resolve(STUBBED_DOMESTIC_STATUS_OPTIONS)
  }
  if (type === ReferenceCodeType.ID_TYPE) {
    return Promise.resolve(STUBBED_IDENTITY_OPTIONS)
  }
  if (type === ReferenceCodeType.GENDER) {
    return Promise.resolve(STUBBED_GENDER_OPTIONS)
  }
  if (type === ReferenceCodeType.LANGUAGE) {
    return Promise.resolve(STUBBED_LANGUAGE_OPTIONS)
  }
  if (type === ReferenceCodeType.RESTRICTION) {
    return Promise.resolve(STUBBED_RESTRICTION_OPTIONS)
  }
  if (type === ReferenceCodeType.ADDRESS_TYPE) {
    return Promise.resolve(STUBBED_ADDRESS_TYPE_OPTIONS)
  }
  if (type === ReferenceCodeType.CITY) {
    return Promise.resolve(STUBBED_CITY_OPTIONS)
  }
  if (type === ReferenceCodeType.COUNTY) {
    return Promise.resolve(STUBBED_COUNTY_OPTIONS)
  }
  if (type === ReferenceCodeType.COUNTRY) {
    return Promise.resolve(STUBBED_COUNTRY_OPTIONS)
  }
  if (type === ReferenceCodeType.RELATIONSHIP_TYPE) {
    return Promise.resolve(STUBBED_RELATIONSHIP_TYPE_OPTIONS)
  }

  return Promise.reject(new Error(`You haven't set up the stubbed reference data for ${type} yet`))
}

const mockedGetReferenceDescriptionForCode = async (
  type: ReferenceCodeType,
  code: string,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  user: Express.User,
): Promise<string> => {
  const groupValues = await mockedReferenceData(type, user)
  return groupValues.find(referenceCode => referenceCode.code === code)?.description ?? ''
}

export {
  mockedReferenceData,
  mockedGetReferenceDescriptionForCode,
  STUBBED_TITLE_OPTIONS,
  STUBBED_RELATIONSHIP_TYPE_OPTIONS,
  STUBBED_SOCIAL_RELATIONSHIP_OPTIONS,
  STUBBED_OFFICIAL_RELATIONSHIP_OPTIONS,
  STUBBED_IDENTITY_OPTIONS,
  STUBBED_LANGUAGE_OPTIONS,
  STUBBED_PHONE_TYPE_OPTIONS,
  STUBBED_DOMESTIC_STATUS_OPTIONS,
  STUBBED_GENDER_OPTIONS,
  STUBBED_RESTRICTION_OPTIONS,
  STUBBED_ADDRESS_TYPE_OPTIONS,
  STUBBED_CITY_OPTIONS,
  STUBBED_COUNTY_OPTIONS,
  STUBBED_COUNTRY_OPTIONS,
}
