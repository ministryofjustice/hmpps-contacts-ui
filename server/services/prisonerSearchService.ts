import { Prisoner, PagePrisoner, PaginationRequest } from '../data/prisonerOffenderSearchTypes'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  async searchInCaseload(
    searchTerm: string,
    prisonId: string,
    pagination: PaginationRequest,
    user: Express.User,
  ): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.searchInCaseload(searchTerm, prisonId, user, pagination)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }
}
