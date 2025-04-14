import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

function sortContactAddresses(addresses: ContactAddressDetails[]): ContactAddressDetails[] {
  const today = new Date().toISOString().substring(0, 10)
  return (
    addresses?.sort(
      (a, b) =>
        +b.primaryAddress - +a.primaryAddress || // primary address to top
        +b.mailFlag - +a.mailFlag || // postal address to top
        +a.startDate - +b.startDate || // nullish start date to top
        +(!b.endDate || b.endDate > today) - +(!a.endDate || a.endDate > today) || // active address to top
        (!a.endDate || a.endDate > today
          ? a.startDate && b.startDate && b.startDate.localeCompare(a.startDate) // recent start date to top for active addresses
          : a.endDate && b.endDate && b.endDate.localeCompare(a.endDate)) || // recent end date to top for inactive addresses
        +a.endDate - +b.endDate, // nullish end date to top
    ) ?? []
  )
}

export default sortContactAddresses
