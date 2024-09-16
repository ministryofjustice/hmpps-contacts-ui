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
  { code: 'HUS', description: 'Husband', groupCode: 'RELATIONSHIP' },
]

const mockedReferenceData = (type: ReferenceCodeType, _: HmppsUser): Promise<StubReferenceData[]> => {
  if (type === ReferenceCodeType.TITLE) {
    return Promise.resolve(STUBBED_TITLE_OPTIONS)
  }
  if (type === ReferenceCodeType.RELATIONSHIP) {
    return Promise.resolve(STUBBED_RELATIONSHIP_OPTIONS)
  }
  return Promise.reject(new Error(`You haven't set up the stubbed reference data for ${type} yet`))
}

export { mockedReferenceData, STUBBED_TITLE_OPTIONS, STUBBED_RELATIONSHIP_OPTIONS }
