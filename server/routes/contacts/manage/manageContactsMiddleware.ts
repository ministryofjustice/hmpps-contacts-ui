import { NextFunction, Request, Response } from 'express'
import logger from '../../../../logger'
import { PrisonerJourneyParams } from '../../../@types/journeys'

const ensureInManageContactsJourney = async (
  req: Request<PrisonerJourneyParams>,
  res: Response,
  next: NextFunction,
) => {
  const { journeyId, prisonerNumber } = req.params

  if (!req.session.manageContactsJourneys) {
    req.session.manageContactsJourneys = {}
  }

  if (!req.session.manageContactsJourneys[journeyId]) {
    logger.warn(
      `Manage contacts journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
    )
    if (prisonerNumber) {
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/list`)
    }
    return res.redirect('/contacts/manage/start')
  }

  req.session.manageContactsJourneys[journeyId].lastTouched = new Date().toISOString()
  return next()
}

export { ensureInManageContactsJourney }
