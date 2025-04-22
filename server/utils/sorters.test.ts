import { employmentSorter, organisationAddressSorter } from './sorters'
import { OrganisationAddressDetails } from '../@types/organisationsApiClient'
import { EmploymentDetails } from '../@types/contactsApiClient'

describe('employmentSorter', () => {
  const a = {
    isActive: true,
    employer: {
      organisationName: 'A',
    },
  } as EmploymentDetails

  const b = {
    isActive: false,
    employer: {
      organisationName: 'B',
    },
  } as EmploymentDetails

  const c = {
    isActive: false,
    employer: {
      organisationName: 'C',
    },
  } as EmploymentDetails

  const anotherC = {
    isActive: false,
    employer: {
      organisationName: 'C',
    },
    employmentId: 999,
  } as EmploymentDetails

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

describe('organisationAddressSorter', () => {
  const primary = {
    primaryAddress: true,
    mailAddress: false,
  } as OrganisationAddressDetails

  const mail = {
    primaryAddress: false,
    mailAddress: true,
  } as OrganisationAddressDetails

  const primaryAndMail = {
    primaryAddress: true,
    mailAddress: true,
  } as OrganisationAddressDetails

  const other = {
    primaryAddress: false,
    mailAddress: false,
  } as OrganisationAddressDetails

  it('should sort by PrimaryAddress, then by MailAddress', () => {
    const res = [mail, primary, primaryAndMail, other].sort(organisationAddressSorter)
    expect(res[0]).toBe(primaryAndMail)
    expect(res[1]).toBe(primary)
    expect(res[2]).toBe(mail)
    expect(res[3]).toBe(other)
  })
})
