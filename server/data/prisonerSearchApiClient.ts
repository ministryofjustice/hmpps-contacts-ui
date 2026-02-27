import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config from '../config'

export default class PrisonerSearchApiClient extends RestClient {
  constructor() {
    super('prisonerSearchApiClient', config.apis.prisonerSearchApi as ApiConfig)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, user)
  }
}
