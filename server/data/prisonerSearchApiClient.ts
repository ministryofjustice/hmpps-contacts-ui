import { RestClient, asSystem, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config from '../config'
import logger from '../../logger'

export default class PrisonerSearchApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonerSearchApiClient', config.apis.prisonerSearchApi, logger, authenticationClient)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, asSystem(user.username))
  }
}
