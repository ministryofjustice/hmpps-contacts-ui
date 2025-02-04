import { employmentSorter } from './sorters'
import { components } from '../@types/contactsApi'

describe('employmentSorter', () => {
  const a = {
    isActive: true,
    employer: {
      organisationName: 'A',
    },
  } as components['schemas']['EmploymentDetails']

  const b = {
    isActive: false,
    employer: {
      organisationName: 'B',
    },
  } as components['schemas']['EmploymentDetails']

  const c = {
    isActive: false,
    employer: {
      organisationName: 'C',
    },
  } as components['schemas']['EmploymentDetails']

  const anotherC = {
    isActive: false,
    employer: {
      organisationName: 'C',
    },
    employmentId: 999,
  } as components['schemas']['EmploymentDetails']

  it('should sort Active employer to the top', () => {
    const res = [c, a, b].sort(employmentSorter)
    expect(res[0]).toBe(a)
  })

  it('should sort by alphabetical order of employer name', () => {
    const res = [c, b].sort(employmentSorter)
    expect(res[0]).toBe(b)
  })

  it('should tie break by sorting greater employmentId to the top (treating nullish as 0)', () => {
    const res = [c, anotherC].sort(employmentSorter)
    expect(res[0]).toBe(anotherC)
  })
})
