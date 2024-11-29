import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails

function sortGlobalRestrictions(globalRestrictions: ContactRestrictionDetails[]): ContactRestrictionDetails[] {
  return globalRestrictions.sort((a, b) => {
    const startDateComparison = new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    if (startDateComparison !== 0) {
      return startDateComparison
    }
    return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
  })
}

export default sortGlobalRestrictions
