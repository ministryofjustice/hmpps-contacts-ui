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

const mockedReferenceData = (type: ReferenceCodeType, _: HmppsUser): Promise<StubReferenceData[]> => {
  if (type === ReferenceCodeType.TITLE) {
    return Promise.resolve(STUBBED_TITLE_OPTIONS)
  }
  return Promise.reject(new Error(`You haven't set up the stubbed reference data for ${type} yet`))
}

export { mockedReferenceData, STUBBED_TITLE_OPTIONS }
