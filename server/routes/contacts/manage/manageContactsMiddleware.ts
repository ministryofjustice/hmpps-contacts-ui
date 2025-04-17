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

const prepareStandaloneManageContactJourney = async (req: Request, res: Response, next: NextFunction) => {
  const { returnUrl, returnAnchor } = req.query
  if (!returnUrl) {
    logger.warn(`No return url specified for standalone manage contacts journey. ${req.url}`)
    return res.status(404).render('pages/errors/notFound')
  }
  res.locals.journey = {
    returnPoint: {
      url: returnUrl as string,
    },
  }
  if (returnAnchor) {
    res.locals.journey.returnPoint.anchor = returnAnchor as string
  }
  return next()
}

export { ensureInManageContactsJourney, prepareStandaloneManageContactJourney }
