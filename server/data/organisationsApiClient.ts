import config from '../config'
import RestClient from './restClient'
import {
  OrganisationDetails,
  OrganisationSummary,
  PagedModelOrganisationSummary,
} from '../@types/organisationsApiClient'

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
  ): Promise<PagedModelOrganisationSummary> {
    const name = encodeURIComponent(searchTerm)
    return this.get<PagedModelOrganisationSummary>(
      {
        path: `/organisation/search?name=${name}&page=${page}&size=${size}${sort.map(itm => `&sort=${encodeURIComponent(itm)}`).join('')}`,
      },
      user,
    )
  }

  async getOrganisation(organisationId: number, user: Express.User): Promise<OrganisationDetails> {
    return this.get<OrganisationDetails>({ path: `/organisation/${organisationId}` }, user)
  }

  async getOrganisationSummary(organisationId: number, user: Express.User): Promise<OrganisationSummary> {
    return this.get<OrganisationSummary>({ path: `/organisation/${organisationId}/summary` }, user)
  }
}
