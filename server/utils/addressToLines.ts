import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
import { components } from '../@types/contactsApi'

type PrisonerContactSummary = components['schemas']['PrisonerContactSummary']

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
