import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import OrganisationSummary = contactsApiClientTypes.OrganisationSummary

export const addressToLines = ({
  flat,
  property,
  street,
  area,
  cityDescription,
  countyDescription,
  postcode,
  postCode,
  countryDescription,
}: Partial<OrganisationSummary | PrisonerContactSummary>): string | null => {
  const addressArray = [
    flat,
    property,
    street,
    area,
    cityDescription,
    countyDescription,
    postcode ?? postCode,
    countryDescription,
  ].filter(s => s)

  return addressArray.length ? addressArray.join('\n') : null
}
