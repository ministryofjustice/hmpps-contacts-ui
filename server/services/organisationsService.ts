import OrganisationsApiClient from '../data/organisationsApiClient'
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage

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
}
