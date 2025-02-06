import OrganisationSummary = contactsApiClientTypes.OrganisationSummary

export const formatBusinessPhoneNumber = ({
  businessPhoneNumber,
  businessPhoneNumberExtension,
}: Partial<OrganisationSummary>): string | null => {
  if (!businessPhoneNumber) {
    return null
  }
  if (businessPhoneNumberExtension) {
    return `${businessPhoneNumber}, ext. ${businessPhoneNumberExtension}`
  }
  return businessPhoneNumber
}
