import { RestClient, asSystem, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import {
  OrganisationDetails,
  OrganisationSummary,
  PagedModelOrganisationSummary,
} from '../@types/organisationsApiClient'

export default class OrganisationsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Organisations API client', config.apis.organisationsApi, logger, authenticationClient)
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
      asSystem(user.username),
    )
  }

  async getOrganisation(organisationId: number, user: Express.User): Promise<OrganisationDetails> {
    return this.get<OrganisationDetails>({ path: `/organisation/${organisationId}` }, asSystem(user.username))
  }

  async getOrganisationSummary(organisationId: number, user: Express.User): Promise<OrganisationSummary> {
    return this.get<OrganisationSummary>({ path: `/organisation/${organisationId}/summary` }, asSystem(user.username))
  }
}
