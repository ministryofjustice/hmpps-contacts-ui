import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config, { ApiConfig } from '../config'

export default class PrisonerSearchApiClient extends RestClient {
  constructor() {
    super('prisonerSearchApiClient', config.apis.prisonerSearchApi as ApiConfig)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, user)
  }
}
