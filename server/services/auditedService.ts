import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import AuditService from './auditService'
import { AuditEvent } from '../data/hmppsAuditClient'

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
          // API clients throw SanitisedError (.responseStatus), but fall back to .status too, matching
          // errorHandler.ts's pattern, in case an http-errors-style error reaches here from elsewhere.
          statusCode: (ex as SanitisedError & { status?: number }).responseStatus ?? (ex as { status?: number }).status,
        },
      })
      throw ex
    }
  }
}
