import { formatBusinessPhoneNumber } from './formatBusinessPhoneNumber'

describe('format business phone number from OrganisationSummary', () => {
  it('should format phone number and extension', () => {
    const organisation = {
      businessPhoneNumber: '1234 5678',
      businessPhoneNumberExtension: '111',
    }

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toEqual('1234 5678, ext. 111')
  })

  it('should handle null extension', () => {
    const organisation = {
      businessPhoneNumber: '1234 5678',
      businessPhoneNumberExtension: undefined,
    }

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toEqual('1234 5678')
  })

  it('should return null when there is no phone number', () => {
    const organisation = {
      businessPhoneNumber: undefined,
      businessPhoneNumberExtension: undefined,
    }

    const result = formatBusinessPhoneNumber(organisation)

    expect(result).toBeNull()
  })
})
