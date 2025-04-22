import { formatBusinessPhoneNumber, formatPhoneNumber } from './formatPhoneNumber'
import TestData from '../routes/testutils/testData'
import {
  OrganisationAddressPhoneDetails,
  OrganisationPhoneDetails,
  OrganisationSummary,
} from '../@types/organisationsApiClient'

describe('format business phone number from OrganisationSummary', () => {
  it('should format phone number and extension for business', () => {
    const organisation = {
      businessPhoneNumber: '1234 5678',
      businessPhoneNumberExtension: '111',
    }

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toEqual('1234 5678, ext. 111')
  })

  it('should handle null extension', () => {
    const organisation: Partial<OrganisationSummary> = {
      businessPhoneNumber: '1234 5678',
    }

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toEqual('1234 5678')
  })

  it('should return null when there is no phone number', () => {
    const organisation: Partial<OrganisationSummary> = {}

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toBeNull()
  })
})

describe('format phone numbers', () => {
  it.each([
    [TestData.getContactPhoneNumberDetails('MOBILE', 'Mobile', '1234 5678', 1, '111'), '1234 5678, ext. 111'],
    [TestData.getAddressPhoneNumberDetails('MOBILE', 'Mobile', '1234 5678', 1, 2, 3, '111'), '1234 5678, ext. 111'],
    [{ phoneNumber: '1234 5678', extNumber: '111' } as OrganisationPhoneDetails, '1234 5678, ext. 111'],
    [{ phoneNumber: '1234 5678', extNumber: '111' } as OrganisationAddressPhoneDetails, '1234 5678, ext. 111'],
  ])('should format phone number and extension', (phone, expected) => {
    const result = formatPhoneNumber(phone)
    expect(result).toEqual(expected)
  })

  it.each([
    [TestData.getContactPhoneNumberDetails('MOBILE', 'Mobile', '1234 5678', 1, undefined), '1234 5678'],
    [TestData.getAddressPhoneNumberDetails('MOBILE', 'Mobile', '1234 5678', 1, 2, 3, undefined), '1234 5678'],
    [{ phoneNumber: '1234 5678' } as OrganisationPhoneDetails, '1234 5678'],
    [{ phoneNumber: '1234 5678' } as OrganisationAddressPhoneDetails, '1234 5678'],
  ])('should format phone number without extension', (phone, expected) => {
    const result = formatPhoneNumber(phone)
    expect(result).toEqual(expected)
  })
})
