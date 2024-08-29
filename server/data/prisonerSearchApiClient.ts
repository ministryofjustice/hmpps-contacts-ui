import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config, { ApiConfig } from '../config'

export default class PrisonerSearchApiClient extends RestClient {
  private pageSize = config.apis.prisonerSearchApi.pageSize

  constructor() {
    super('prisonerSearchApiClient', config.apis.prisonerSearchApi as ApiConfig)
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    page = 0,
    user: Express.User,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
          page: page.toString(),
          size: this.pageSize.toString(),
        }).toString(),
      },
      user,
    )
  }

  async getPrisoner(search: string, prisonId: string, user: Express.User): Promise<{ content: Prisoner[] }> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
        }).toString(),
      },
      user,
    )
  }

  async getPrisonerById(id: string, user: Express.User): Promise<Prisoner> {
    return this.get(
      {
        path: `/prisoner/${id}`,
      },
      user,
    )
  }
}
