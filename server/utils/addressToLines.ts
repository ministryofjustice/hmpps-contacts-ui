import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import OrganisationSummary = contactsApiClientTypes.OrganisationSummary

export const addressToLines = ({
  flat,
  premise,
  street,
  area,
  city,
  county,
  postalCode,
  country,
}: Partial<PrisonerContactSummary>): string | null => {
  const addressArray = [flat, premise, street, area, city, county, postalCode, country].filter(s => s)
  return addressArray.length ? addressArray.join('\n') : null
}

export const businessAddressToLines = ({
  flat,
  property,
  street,
  area,
  cityDescription,
  countyDescription,
  postcode,
  countryDescription,
}: Partial<OrganisationSummary>): string | null => {
  const addressArray = [
    flat,
    property,
    street,
    area,
    cityDescription,
    countyDescription,
    postcode,
    countryDescription,
  ].filter(s => s)

  return addressArray.length ? addressArray.join('\n') : null
}
