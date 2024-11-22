import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

function sortContactAddresses(addresses: ContactAddressDetails[]): ContactAddressDetails[] {
  return addresses.sort((a, b) => {
    if (a.primaryAddress !== b.primaryAddress) {
      return a.primaryAddress ? -1 : 1
    }

    if (a.mailFlag !== b.mailFlag) {
      return a.mailFlag ? -1 : 1
    }

    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
}

export default sortContactAddresses
