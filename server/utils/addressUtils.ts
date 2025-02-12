import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

const getAddressTitle = (address: ContactAddressDetails, expired: boolean): string => {
  let title = address.addressTypeDescription ?? 'Address'
  if (address.primaryAddress && address.mailFlag) {
    title = 'Primary and postal address'
  } else if (address.primaryAddress) {
    title = 'Primary address'
  } else if (address.mailFlag) {
    title = 'Postal address'
  }
  return expired ? `Previous ${title.toLowerCase()}` : title
}

const isExpiredAddress = (endDate?: string): boolean => {
  if (endDate) {
    const expirationDate = new Date(endDate)
    return expirationDate.getTime() < new Date().getTime()
  }
  return false
}

export { getAddressTitle, isExpiredAddress }
