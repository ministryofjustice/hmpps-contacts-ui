import { OrganisationSummary } from '../@types/organisationsApiClient'
import { PrisonerContactSummary } from '../@types/contactsApiClient'

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
}: Partial<(OrganisationSummary | PrisonerContactSummary) & { postCode?: string }>): string | null => {
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

export const coarseAddressToLines = ({
  cityDescription,
  countyDescription,
  countryDescription,
}: Partial<(OrganisationSummary | PrisonerContactSummary) & { postCode?: string }>): string | null => {
  const addressArray = [cityDescription, countyDescription, countryDescription].filter(s => s)

  return addressArray.length ? addressArray.join('\n') : null
}
