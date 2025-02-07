import config from '../config'
import RestClient from './restClient'
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage

export default class OrganisationsApiClient extends RestClient {
  constructor() {
    super('Organisations API client', config.apis.organisationsApi)
  }

  async searchOrganisations(
    {
      searchTerm,
      page,
      size,
      sort,
    }: {
      searchTerm: string
      page: number
      size: number
      sort: string[]
    },
    user: Express.User,
  ): Promise<OrganisationSummaryResultItemPage> {
    const name = encodeURIComponent(searchTerm)
    return this.get<OrganisationSummaryResultItemPage>(
      {
        path: `/organisation/search?name=${name}&page=${page}&size=${size}${sort.map(itm => `&sort=${encodeURIComponent(itm)}`).join('')}`,
      },
      user,
    )
  }
}
