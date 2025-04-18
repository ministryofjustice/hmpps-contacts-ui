import OrganisationsApiClient from '../data/organisationsApiClient'
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage
import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails
import OrganisationSummary = organisationsApiClientTypes.OrganisationSummary

export default class OrganisationsService {
  constructor(private readonly organisationsApiClient: OrganisationsApiClient) {}

  async searchOrganisations(
    searchParams: {
      searchTerm: string
      page: number
      size: number
      sort: string[]
    },
    user: Express.User,
  ): Promise<OrganisationSummaryResultItemPage> {
    return this.organisationsApiClient.searchOrganisations(searchParams, user)
  }

  async getOrganisation(organisationId: number, user: Express.User): Promise<OrganisationDetails> {
    return this.organisationsApiClient.getOrganisation(organisationId, user)
  }

  async getOrganisationSummary(organisationId: number, user: Express.User): Promise<OrganisationSummary> {
    return this.organisationsApiClient.getOrganisationSummary(organisationId, user)
  }
}
