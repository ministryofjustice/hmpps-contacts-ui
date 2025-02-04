import { Request, Response, NextFunction } from 'express'
import logger from '../../../../../logger'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export const ensureInUpdateEmploymentsJourney = async (
  req: Request<PrisonerJourneyParams>,
  res: Response,
  next: NextFunction,
) => {
  const { journeyId } = req.params
  if (!req.session.updateEmploymentsJourneys?.[journeyId]) {
    logger.warn(
      `Update employments journey (${journeyId}) not found for user ${res.locals.user?.username}. Rendering not found.`,
    )
    return res.render('pages/errors/notFound')
  }
  req.session.updateEmploymentsJourneys[journeyId].lastTouched = new Date().toISOString()
  return next()
}
