import { Request, RequestHandler } from 'express'

const ensureInManageContactsJourney = (): RequestHandler => {
  return async (req: Request<{ journeyId: string; prisonerNumber?: string }, unknown, unknown>, res, next) => {
    const { journeyId, prisonerNumber } = req.params

    if (!req.session.manageContactsJourneys) {
      req.session.manageContactsJourneys = {}
    }

    if (!req.session.manageContactsJourneys[journeyId]) {
      if (prisonerNumber) {
        return res.redirect(`/prisoner/${prisonerNumber}/contacts/list`)
      }
      return res.redirect('/contacts/manage/start')
    }

    req.session.manageContactsJourneys[journeyId].lastTouched = new Date().toISOString()
    return next()
  }
}

export default ensureInManageContactsJourney
