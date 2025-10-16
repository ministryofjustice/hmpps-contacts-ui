import AuditService from './auditService'
import AuditedService from './auditedService'
import AlertsApiClient from '../data/alertsApiClient'

export default class AlertsService extends AuditedService {
  constructor(
    private readonly alertsApiClient: AlertsApiClient,
    override readonly auditService: AuditService,
  ) {
    super(auditService)
  }

  async getAlerts(prisonerNumber: string, user: Express.User) {
    return this.alertsApiClient.getAllAlerts(prisonerNumber, user)
  }
}
