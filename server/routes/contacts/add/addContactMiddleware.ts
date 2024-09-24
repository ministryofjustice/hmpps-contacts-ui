import { Request, RequestHandler } from 'express'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

const ensureInAddContactJourney = (): RequestHandler => {
  return async (req: Request<PrisonerJourneyParams, unknown, unknown>, res, next) => {
    const { journeyId, prisonerNumber } = req.params
    if (!req.session.addContactJourneys) {
      req.session.addContactJourneys = {}
    }
    if (!req.session.addContactJourneys[journeyId]) {
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/start`)
    }
    req.session.addContactJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  }
}

export default ensureInAddContactJourney
