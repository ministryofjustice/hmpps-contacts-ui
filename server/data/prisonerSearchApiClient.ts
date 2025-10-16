import RestClient from './restClient'
import { Prisoner, PagePrisoner, PaginationRequest } from './prisonerOffenderSearchTypes'
import config, { ApiConfig } from '../config'

export default class PrisonerSearchApiClient extends RestClient {
  constructor() {
    super('prisonerSearchApiClient', config.apis.prisonerSearchApi as ApiConfig)
  }

  async searchInCaseload(
    searchTerm: string,
    prisonId: string,
    user: Express.User,
    pagination?: PaginationRequest,
  ): Promise<PagePrisoner> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.prisonerSearchApi.pageSize || 20 }
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: { term: searchTerm, ...paginationParameters },
      },
      user,
    )
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, user)
  }
}
