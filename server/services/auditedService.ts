import AuditService from './auditService'
import { AuditEvent } from '../data/hmppsAuditClient'
import { SanitisedError } from '../sanitisedError'

export default class AuditedService {
  constructor(protected readonly auditService: AuditService) {}

  protected async handleAuditEvent<T>(apiPromise: Promise<T>, event: AuditEvent) {
    try {
      const res = await apiPromise
      this.auditService.logAuditEvent(event)
      return res
    } catch (ex: unknown) {
      this.auditService.logAuditEvent({
        ...event,
        what: `FAILURE_${event.what}`,
        details: {
          ...(event.details ?? {}),
          statusCode: (ex as SanitisedError).status,
        },
      })
      throw ex
    }
  }
}
