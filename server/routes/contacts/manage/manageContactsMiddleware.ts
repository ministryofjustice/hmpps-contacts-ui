import { RequestHandler } from 'express'
import logger from '../../../../logger'
import asyncMiddleware from '../../../middleware/asyncMiddleware'

const ensureInManageContactsJourney = (): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
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

const ensureInUpdateDateOfBirthJourney = (): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { journeyId, prisonerNumber, contactId } = req.params
    if (!req.session.updateDateOfBirthJourneys) {
      req.session.updateDateOfBirthJourneys = {}
    }
    if (!req.session.updateDateOfBirthJourneys[journeyId]) {
      logger.warn(
        `Update date of birth journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/start`)
    }
    req.session.updateDateOfBirthJourneys[journeyId].lastTouched = new Date().toISOString()

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
        url: returnUrl,
      },
    }
    return next()
  })
}

export { ensureInManageContactsJourney, ensureInUpdateDateOfBirthJourney, prepareStandaloneManageContactJourney }
