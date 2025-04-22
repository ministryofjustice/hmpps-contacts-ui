import {
  OrganisationAddressPhoneDetails,
  OrganisationPhoneDetails,
  OrganisationSummary,
} from '../@types/organisationsApiClient'
import { ContactAddressPhoneDetails, ContactPhoneDetails } from '../@types/contactsApiClient'

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
}: ContactPhoneDetails | ContactAddressPhoneDetails | OrganisationPhoneDetails | OrganisationAddressPhoneDetails):
  | string
  | null => {
  return phoneToString(phoneNumber, extNumber)
}

const phoneToString = (phoneNumber: string, extension?: string): string => {
  if (extension) {
    return `${phoneNumber}, ext. ${extension}`
  }
  return phoneNumber
}
