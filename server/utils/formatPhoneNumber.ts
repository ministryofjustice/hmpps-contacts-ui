import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails
import OrganisationPhoneDetails = organisationsApiClientTypes.OrganisationPhoneDetails
import OrganisationAddressPhoneDetails = organisationsApiClientTypes.OrganisationAddressPhoneDetails

export const formatBusinessPhoneNumber = ({
  businessPhoneNumber,
  businessPhoneNumberExtension,
}: Partial<OrganisationSummary>): string | null => {
  if (!businessPhoneNumber) {
    return null
  }
  return phoneToString(businessPhoneNumber, businessPhoneNumberExtension)
}

export const formatPhoneNumber = ({
  phoneNumber,
  extNumber,
}: Partial<
  ContactPhoneDetails | ContactAddressPhoneDetails | OrganisationPhoneDetails | OrganisationAddressPhoneDetails
>): string | null => {
  return phoneToString(phoneNumber, extNumber)
}

const phoneToString = (phoneNumber: string, extension?: string): string => {
  if (extension) {
    return `${phoneNumber}, ext. ${extension}`
  }
  return phoneNumber     
}
