import { NextFunction, Request, Response } from 'express'
import logger from '../../../../../../logger'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export const ensureInChangeRelationshipTypeJourney = async (
  req: Request<PrisonerJourneyParams>,
  res: Response,
  next: NextFunction,
) => {
  const { journeyId } = req.params
  if (!req.session.changeRelationshipTypeJourneys?.[journeyId]) {
    logger.warn(
      `Change relationship type journey (${journeyId}) not found for user ${res.locals.user?.username}. Rendering not found.`,
    )
    return res.status(404).render('pages/errors/notFound')
  }
  req.session.changeRelationshipTypeJourneys[journeyId].lastTouched = new Date().toISOString()
  return next()
}
