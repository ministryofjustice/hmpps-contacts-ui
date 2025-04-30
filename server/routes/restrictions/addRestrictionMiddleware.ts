import { Request } from 'express'
import logger from '../../../logger'
import asyncMiddleware from '../../middleware/asyncMiddleware'

const ensureInAddRestrictionJourney = asyncMiddleware(
  async (req: Request<{ journeyId: string; prisonerNumber: string }>, res, next) => {
    const { journeyId } = req.params
    if (!req.session.addRestrictionJourneys) {
      req.session.addRestrictionJourneys = {}
    }
    if (!req.session.addRestrictionJourneys[journeyId]) {
      logger.warn(
        `Add restriction journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.status(404).render('pages/errors/notFound')
    }
    req.session.addRestrictionJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  },
)

export default ensureInAddRestrictionJourney
