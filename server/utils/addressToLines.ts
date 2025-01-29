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
  let lineOne = [premise, street].filter(s => s).join(', ')
  if (flat) {
    lineOne = `Flat ${flat}, ${lineOne}`
  }
  const addressArray = [lineOne, area, city, county, postalCode, country].filter(s => s).join('<br />')
  if (addressArray.length !== 1 || !country) return addressArray
  return null
}

export const businessAddressToLines = ({
  flat,
  property,
  street,
  area,
  cityDescription,
  countyDescription,
  postalCode,
  countryDescription,
}: Partial<OrganisationSummary>): string | null => {
  let lineOne = property
  if (flat) {
    const flatString = flat.toLowerCase().startsWith('flat') ? flat : `Flat ${flat}`
    lineOne = lineOne ? `${flatString}, ${lineOne}` : flatString
  }
  const addressArray = [
    lineOne,
    street,
    area,
    cityDescription,
    countyDescription,
    postalCode,
    countryDescription,
  ].filter(s => s)

  return addressArray.length ? addressArray.join('\n') : null
}
