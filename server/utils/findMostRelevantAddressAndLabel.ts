import { ContactAddressDetails, ContactDetails } from '../@types/contactsApiClient'

export function findMostRelevantAddress(contact: ContactDetails, fallbackToExpired: boolean = false) {
  const currentAddresses = contact.addresses?.filter((address: ContactAddressDetails) => !address.endDate)
  let mostRelevantAddress: ContactAddressDetails = currentAddresses?.find(
    (address: ContactAddressDetails) => address.primaryAddress,
  )
  if (!mostRelevantAddress) {
    mostRelevantAddress = currentAddresses?.find((address: ContactAddressDetails) => address.mailFlag)
  }
  if (!mostRelevantAddress) {
    mostRelevantAddress = currentAddresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
      return (seed && seed.startDate > item.startDate) || !item.startDate ? seed : item
    }, null)
  }
  if (!mostRelevantAddress && fallbackToExpired) {
    mostRelevantAddress = contact.addresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
      return seed && seed.startDate > item.startDate ? seed : item
    }, null)
  }
  return mostRelevantAddress
}

export function getLabelForAddress(mostRelevantAddress: ContactAddressDetails) {
  let mostRelevantAddressLabel
  if (mostRelevantAddress?.primaryAddress) {
    if (mostRelevantAddress?.mailFlag) {
      mostRelevantAddressLabel = 'Primary and mail'
    } else {
      mostRelevantAddressLabel = 'Primary'
    }
  } else if (mostRelevantAddress?.mailFlag) {
    mostRelevantAddressLabel = 'Mail'
  }
  return mostRelevantAddressLabel
}
