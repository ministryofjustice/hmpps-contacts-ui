export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const extractPrisonerNumber = (search: string): string | false => {
  const searchTerms = search.toUpperCase().split(' ')
  return searchTerms.find(term => isValidPrisonerNumber(term)) || false
}
