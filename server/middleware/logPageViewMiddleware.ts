import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import AuditService from '../services/auditService'
import asyncMiddleware from './asyncMiddleware'

export default function logPageViewMiddleware(auditService: AuditService, pageHandler: PageHandler): RequestHandler {
  const CONTACT_ID_REGEX = /(contacts\/|contacts\/manage\/|contacts\/add\/match\/)([0-9]+)\//
  const PRISON_NUMBER_REGEX = /prisoner\/([0-9A-z]+)\//
  const PRISONER_CONTACT_NUMBER_REGEX = /(?:relationship|prisoner-contact)\/([^/]+)/
  const EMPLOYER_NUMBER_REGEX = /(?:check-employer|delete-employment|update-employments)\/([a-f0-9-]+)/
  const ORGANISATION_ID_REGEX = /organisationId=([^&]+)/

  return asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (res.statusCode !== 200) {
      return next()
    }

    const details = (() => {
      const contactId = req.originalUrl.match(CONTACT_ID_REGEX)?.[2]
      const prisonerNumber = req.originalUrl.match(PRISON_NUMBER_REGEX)?.[1]
      const prisonerContactId = req.originalUrl.match(PRISONER_CONTACT_NUMBER_REGEX)?.[1]
      const employerId = req.originalUrl.match(EMPLOYER_NUMBER_REGEX)?.[1]
      const organisationId = req.originalUrl.match(ORGANISATION_ID_REGEX)?.[1]
      const result: Record<string, unknown> = {}

      if (prisonerNumber !== undefined) result['prisonerNumber'] = prisonerNumber
      if (contactId !== undefined) result['contactId'] = contactId
      if (prisonerContactId !== undefined) result['prisonerContactId'] = prisonerContactId
      if (employerId !== undefined) result['employerId'] = employerId
      if (organisationId !== undefined) result['organisationId'] = organisationId

      return result
    })()

    const eventDetails = {
      who: res.locals.user.username,
      correlationId: req.id,
      details,
    }

    await auditService.logPageView(pageHandler.PAGE_NAME, eventDetails)
    return next()
  })
}
