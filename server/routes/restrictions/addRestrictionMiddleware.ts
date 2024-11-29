import { Request, RequestHandler } from 'express'
import logger from '../../../logger'
import RestrictionClass = journeys.RestrictionClass

const ensureInAddRestrictionJourney = (): RequestHandler => {
  return async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: RestrictionClass
        journeyId: string
      },
      unknown,
      unknown
    >,
    res,
    next,
  ) => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    if (!req.session.addRestrictionJourneys) {
      req.session.addRestrictionJourneys = {}
    }
    if (!req.session.addRestrictionJourneys[journeyId]) {
      logger.warn(
        `Add restriction journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start`,
      )
    }
    req.session.addRestrictionJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  }
}

export default ensureInAddRestrictionJourney
