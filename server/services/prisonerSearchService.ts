import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }
}
