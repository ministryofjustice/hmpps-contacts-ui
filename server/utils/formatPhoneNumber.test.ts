import { formatPhoneNumber } from './formatPhoneNumber'

describe('format business phone number from OrganisationSummary', () => {
  it('should format phone number and extension', () => {
    const organisation = {
      businessPhoneNumber: '1234 5678',
      businessPhoneNumberExtension: '111',
    }

    const result = formatPhoneNumber(organisation)

    expect(result).toEqual('1234 5678, ext. 111')
  })

  it('should handle null extension', () => {
    const organisation = {
      businessPhoneNumber: '1234 5678',
      businessPhoneNumberExtension: undefined,
    }

    const result = formatPhoneNumber(organisation)

    expect(result).toEqual('1234 5678')
  })

  it('should return null when there is no phone number', () => {
    const organisation = {
      businessPhoneNumber: undefined,
      businessPhoneNumberExtension: undefined,
    }

    const result = formatPhoneNumber(organisation)

    expect(result).toBeNull()
  })
})

describe('format phone number from PrisonerContactSummary', () => {
  it('should format phone number and extension', () => {
    const contact = {
      phoneNumber: '1234 5678',
      extNumber: '111',
    }

    const result = formatPhoneNumber(contact)

    expect(result).toEqual('1234 5678, ext. 111')
  })

  it('should handle null extension', () => {
    const contact = {
      phoneNumber: '1234 5678',
      extNumber: undefined,
    }

    const result = formatPhoneNumber(contact)

    expect(result).toEqual('1234 5678')
  })

  it('should return null when there is no phone number', () => {
    const contact = {
      phoneNumber: undefined,
      extNumber: undefined,
    }

    const result = formatPhoneNumber(contact)

    expect(result).toBeNull()
  })
})
