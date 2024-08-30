import { Request, RequestHandler } from 'express'

const ensureInCreateContactJourney = (): RequestHandler => {
  return async (req: Request<{ journeyId: string }, unknown, unknown>, res, next) => {
    const { journeyId } = req.params
    if (!req.session.createContactJourneys) {
      req.session.createContactJourneys = {}
    }
    if (!req.session.createContactJourneys[journeyId]) {
      return res.redirect('/contacts/create/start')
    }
    return next()
  }
}

export default ensureInCreateContactJourney
