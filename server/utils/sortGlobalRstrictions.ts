import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails

function sortRestrictions(restrictions: ContactRestrictionDetails[]): ContactRestrictionDetails[] {
  return restrictions.sort((a, b) => {
    const startDateComparison = new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    if (startDateComparison !== 0) {
      return startDateComparison
    }
    return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
  })
}

export default sortRestrictions
