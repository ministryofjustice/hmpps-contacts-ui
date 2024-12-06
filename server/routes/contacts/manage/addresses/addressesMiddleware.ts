import { RequestHandler } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import logger from '../../../../../logger'

const ensureInAddressJourney = (): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { journeyId } = req.params
    if (!req.session.addressJourneys) {
      req.session.addressJourneys = {}
    }
    if (!req.session.addressJourneys[journeyId]) {
      logger.warn(
        `Address journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Rendering not found.`,
      )
      return res.render('pages/errors/notFound')
    }
    req.session.addressJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  })
}

export default ensureInAddressJourney
