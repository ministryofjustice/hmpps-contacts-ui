import { Request, Response, NextFunction } from 'express'
import logger from '../../../../../logger'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import UpdateEmploymentJourneyParams = journeys.UpdateEmploymentJourneyParams

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
    return res.status(404).render('pages/errors/notFound')
  }
  req.session.updateEmploymentsJourneys[journeyId].lastTouched = new Date().toISOString()
  return next()
}

export const ensureValidEmploymentIdx = async (
  req: Request<UpdateEmploymentJourneyParams>,
  res: Response,
  next: NextFunction,
) => {
  const { journeyId, employmentIdx } = req.params
  const journey = req.session.updateEmploymentsJourneys![journeyId]!
  const employmentIdxNumber = Number(employmentIdx)

  if (employmentIdx !== 'new' && (Number.isNaN(employmentIdxNumber) || !journey.employments[employmentIdxNumber - 1])) {
    logger.warn(
      `Invalid employment index (${employmentIdx}) for Update employments journey (${journeyId}) by user ${res.locals.user?.username}.`,
    )
    return res.status(404).render('pages/errors/notFound')
  }
  return next()
}
