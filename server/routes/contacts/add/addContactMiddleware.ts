import { NextFunction, Request, Response } from 'express'
import logger from '../../../../logger'
import asyncMiddleware from '../../../middleware/asyncMiddleware'

export const ensureInAddContactJourney = asyncMiddleware(
  async (req: Request<{ journeyId: string; prisonerNumber: string }>, res, next) => {
    const { journeyId, prisonerNumber } = req.params
    if (!req.session.addContactJourneys) {
      req.session.addContactJourneys = {}
    }
    if (!req.session.addContactJourneys[journeyId]) {
      logger.warn(
        `Add contact journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/start`)
    }
    req.session.addContactJourneys[journeyId].lastTouched = new Date().toISOString()

    return next()
  },
)

// remove entered details from the journey to prevent mixing up details from new and existing contacts but keep
// the search params so we get back to the same search if going back to the start of the journey.
export const resetAddContactJourney = async (
  req: Request<{ journeyId: string }>,
  res: Response,
  next: NextFunction,
) => {
  const { journeyId } = req.params
  const existingJourney = req.session.addContactJourneys![journeyId]!
  req.session.addContactJourneys![journeyId] = {
    id: existingJourney.id,
    lastTouched: existingJourney.lastTouched,
    isCheckingAnswers: false,
    prisonerNumber: existingJourney.prisonerNumber,
    searchContact: existingJourney.searchContact,
    prisonerDetails: existingJourney.prisonerDetails,
  }
  return next()
}
