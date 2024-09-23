import { Request, RequestHandler } from 'express'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

const ensureInAddContactJourney = (): RequestHandler => {
  return async (req: Request<PrisonerJourneyParams, unknown, unknown>, res, next) => {
    const { journeyId, prisonerNumber } = req.params
    if (!req.session.createContactJourneys) {
      req.session.createContactJourneys = {}
    }
    if (!req.session.createContactJourneys[journeyId]) {
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/start`)
    }
    req.session.createContactJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  }
}

export default ensureInAddContactJourney
