import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import AuditService from '../services/auditService'
import asyncMiddleware from './asyncMiddleware'

export default function logPageViewMiddleware(auditService: AuditService, pageHandler: PageHandler): RequestHandler {
  return asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const eventDetails = {
      who: res.locals.user.username,
      correlationId: req.id,
      details: Object.fromEntries(
        Object.entries({ prisonerNumber, contactId, prisonerContactId }).filter(([_, value]) => value !== undefined),
      ),
    }
    await auditService.logPageView(pageHandler.PAGE_NAME, eventDetails)
    return next()
  })
}
