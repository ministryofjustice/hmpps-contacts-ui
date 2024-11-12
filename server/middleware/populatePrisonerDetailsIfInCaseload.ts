import { Request, RequestHandler } from 'express'
import { PrisonerSearchService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from './asyncMiddleware'
import PrisonerDetails = journeys.PrisonerDetails

const populatePrisonerDetailsIfInCaseload = (prisonerSearchService: PrisonerSearchService): RequestHandler => {
  return asyncMiddleware(async (req: Request<{ prisonerNumber: string }>, res, next) => {
    const { prisonerNumber } = req.params
    const { user } = res.locals
    const prisoner = await prisonerSearchService.getByPrisonerNumber(prisonerNumber, user)
    if (!req.session.prisonId || req.session.prisonId !== prisoner.prisonId) {
      return res.render('pages/errors/notFound')
    }
    res.locals.prisonerDetails = toPrisonerDetails(prisoner)
    return next()
  })

  function toPrisonerDetails(prisoner: Prisoner): PrisonerDetails {
    return {
      prisonerNumber: prisoner.prisonerNumber,
      lastName: prisoner.lastName,
      firstName: prisoner.firstName,
      dateOfBirth: prisoner.dateOfBirth,
      prisonName: prisoner.prisonName,
      cellLocation: prisoner.cellLocation,
    }
  }
}

export default populatePrisonerDetailsIfInCaseload
