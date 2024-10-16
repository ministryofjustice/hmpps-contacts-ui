import { Request, RequestHandler } from 'express'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import logger from '../../../../logger'

const ensureInAddContactJourney = (): RequestHandler => {
  return async (req: Request<PrisonerJourneyParams, unknown, unknown>, res, next) => {
    const { journeyId, prisonerNumber } = req.params
    if (!req.session.addContactJourneys) {
      req.session.addContactJourneys = {}
    }
    if (!req.session.addContactJourneys[journeyId]) {
      logger.warn(
        `Add contact journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/start`)
    }
    req.session.addContactJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  }
}

export default ensureInAddContactJourney
