import { NextFunction, Request, Response, RequestHandler } from 'express'
import logger from '../../../../logger'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

const ensureInManageContactsJourney = () => {
  return asyncMiddleware(async (req: Request<PrisonerJourneyParams>, res: Response, next: NextFunction) => {
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
  })
}

const prepareStandaloneManageContactJourney = (): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { returnUrl } = req.query
    if (!returnUrl) {
      throw new Error(`Couldn't find return URL for standalone journey`)
    }
    res.locals.journey = {
      returnPoint: {
        url: returnUrl as string,
      },
    }
    return next()
  })
}

export { ensureInManageContactsJourney, prepareStandaloneManageContactJourney }
