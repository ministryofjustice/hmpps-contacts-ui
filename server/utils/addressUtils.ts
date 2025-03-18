import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import { isDateAndInThePast } from './utils'

const formatTitleForAddress = (address: ContactAddressDetails & { mailAddress?: boolean }): string => {
  let title = address.addressTypeDescription ?? 'Address'
  if (address.primaryAddress && (address.mailFlag || address.mailAddress)) {
    title = 'Primary and postal address'
  } else if (address.primaryAddress) {
    title = 'Primary address'
  } else if (address.mailFlag || address.mailAddress) {
    title = 'Postal address'
  }
  return isDateAndInThePast(address.endDate) ? `Previous ${title.toLowerCase()}` : title
}

export { formatTitleForAddress }
