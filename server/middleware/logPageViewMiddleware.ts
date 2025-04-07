import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import AuditService from '../services/auditService'
import asyncMiddleware from './asyncMiddleware'

export default function logPageViewMiddleware(auditService: AuditService, pageHandler: PageHandler): RequestHandler {
  const JOURNEY_TYPES = {
    ADD_CONTACT: 'addContactJourneys',
    MANAGE_CONTACTS: 'manageContactsJourneys',
    ADD_RESTRICTION: 'addRestrictionJourneys',
    ADDRESS: 'addressJourneys',
    UPDATE_EMPLOYMENTS: 'updateEmploymentsJourneys',
    CHANGE_RELATIONSHIP_TYPE: 'changeRelationshipTypeJourneys',
  } as const

  return asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (!(res.statusCode >= 400 && res.statusCode < 600) || !res.statusCode === 302) {
      const { journeyId } = req.params

      const journey = Object.values(JOURNEY_TYPES).find(type => req.session?.[type]?.[journeyId])

      const details = (() => {
        if (!journey) return undefined

        const journeyData = req.session[journey]?.[journeyId]
        if (!journeyData) return undefined

        const result = {}
        const { prisonerNumber, contactId, prisonerContactId } = journeyData

        if (prisonerNumber !== undefined) result['prisonerNumber'] = prisonerNumber
        if (contactId !== undefined) result['contactId'] = contactId
        if (prisonerContactId !== undefined) result['prisonerContactId'] = prisonerContactId

        return Object.keys(result).length > 0 ? result : undefined
      })()

      const eventDetails = {
        who: res.locals.user.username,
        correlationId: req.id,
        details,
      }
      await auditService.logPageView(pageHandler.PAGE_NAME, eventDetails)
    }
    return next()
  })
}
