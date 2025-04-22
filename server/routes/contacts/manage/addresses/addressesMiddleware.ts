import { NextFunction, Request, Response } from 'express'
import logger from '../../../../../logger'
import { PrisonerJourneyParams } from '../../../../@types/journeys'

const ensureInAddressJourney = async (req: Request<PrisonerJourneyParams>, res: Response, next: NextFunction) => {
  const { journeyId } = req.params
  if (!req.session.addressJourneys) {
    req.session.addressJourneys = {}
  }
  if (!req.session.addressJourneys[journeyId]) {
    logger.warn(
      `Address journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Rendering not found.`,
    )
    return res.status(404).render('pages/errors/notFound')
  }
  req.session.addressJourneys[journeyId].lastTouched = new Date().toISOString()

  return next()
}

export default ensureInAddressJourney
