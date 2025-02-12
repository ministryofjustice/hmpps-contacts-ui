import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

export const formatPhoneNumber = (obj: Partial<OrganisationSummary & PrisonerContactSummary>): string | null => {
  if (!obj) return null

  const { businessPhoneNumber, businessPhoneNumberExtension, phoneNumber, extNumber } = obj
  if (businessPhoneNumber) {
    return businessPhoneNumberExtension
      ? `${businessPhoneNumber}, ext. ${businessPhoneNumberExtension}`
      : businessPhoneNumber
  }
  if (phoneNumber) {
    return extNumber ? `${phoneNumber}, ext. ${extNumber}` : phoneNumber
  }
  return null
}
