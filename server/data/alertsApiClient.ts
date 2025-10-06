import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { PageAlert } from './alertsApiTypes'

export default class AlertsApiClient extends RestClient {
  constructor() {
    super('alertsApiClient', config.apis.alertsApi as ApiConfig)
  }

  async getAllAlerts(prisonerNumber: string, user: Express.User): Promise<PageAlert> {
    return this.get({ path: `/prisoners/${prisonerNumber}/alerts?isActive=true` }, user)
  }
}
