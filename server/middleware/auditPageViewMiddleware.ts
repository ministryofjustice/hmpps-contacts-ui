import { RequestHandler } from 'express'
import { AuditService } from '../services'
import { AuditEvent } from '../data/hmppsAuditClient'

export const auditPageViewMiddleware = (auditService: AuditService): RequestHandler => {
  const CONTACT_ID_REGEX = /(contacts\/manage\/|contacts\/add\/match\/)([0-9]+)\//
  const PRISON_NUMBER_REGEX = /prisoner\/([0-9A-z]+)\//

  return async (req, res, next) => {
    res.prependOnceListener('close', async () => {
      let auditEventName: string | undefined

      if ([403, 404].includes(res.statusCode)) {
        auditEventName = 'UNAUTHORISED_PAGE_VIEW'
      } else if (res.statusCode >= 500 && res.statusCode <= 599) {
        auditEventName = 'FAILED_PAGE_VIEW'
      }
      if (auditEventName) {
        const event: AuditEvent = {
          what: auditEventName,
          who: res.locals.user.username,
          correlationId: req.id,
          details: {
            url: req.originalUrl,
            statusCode: res.statusCode,
          },
        }
        const contactId = req.originalUrl.match(CONTACT_ID_REGEX)?.[2]
        const prisonNumber = req.originalUrl.match(PRISON_NUMBER_REGEX)?.[1]
        if (contactId) {
          event.subjectType = 'CONTACT'
          event.subjectId = contactId
        }
        if (prisonNumber) {
          if (!event.subjectType) {
            event.subjectType = 'PRISONER'
            event.subjectId = prisonNumber
          }
          event.details = {
            ...event.details,
            prisonNumber,
          }
        }
        await auditService.logAuditEvent(event)
      }
    })
    next()
  }
}
