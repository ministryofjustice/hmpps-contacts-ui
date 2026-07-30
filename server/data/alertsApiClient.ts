import { RestClient, asSystem, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import { PageAlert } from './alertsApiTypes'
import logger from '../../logger'

export default class AlertsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('alertsApiClient', config.apis.alertsApi, logger, authenticationClient)
  }

  async getAllAlerts(prisonerNumber: string, user: Express.User): Promise<PageAlert> {
    return this.get({ path: `/prisoners/${prisonerNumber}/alerts` }, asSystem(user.username))
  }
}
