import { Request } from 'express'
import { AuditService, PrisonerSearchService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from './asyncMiddleware'
import PrisonerDetails = journeys.PrisonerDetails

const populatePrisonerDetailsIfInCaseload = (
  prisonerSearchService: PrisonerSearchService,
  auditService: AuditService,
) => {
  return asyncMiddleware(async (req: Request<{ prisonerNumber: string }>, res, next) => {
    const { prisonerNumber } = req.params
    const { user } = res.locals
    return prisonerSearchService.getByPrisonerNumber(prisonerNumber, user).then((prisoner: Prisoner) => {
      if (!req.session.activeCaseLoadId || req.session.activeCaseLoadId !== prisoner.prisonId) {
        auditService.logAuditEvent({
          what: 'NOT_IN_CASELOAD',
          who: user.username,
          correlationId: req.id,
          subjectType: 'PRISONER_NUMBER',
          subjectId: prisonerNumber,
          details: {
            userCurrentPrison: req.session.activeCaseLoadId,
            prisonerCurrentPrison: prisoner.prisonId,
          },
        })
        return res.status(404).render('pages/errors/notFound')
      }

      res.locals.prisonerDetails = toPrisonerDetails(prisoner)
      return next()
    })
  })

  function toPrisonerDetails(prisoner: Prisoner): PrisonerDetails {
    let hasPrimaryAddress = false
    if (
      prisoner.addresses &&
      prisoner.addresses.length > 0 &&
      prisoner.addresses.find(address => address.primaryAddress)
    ) {
      hasPrimaryAddress = true
    }
    return {
      prisonerNumber: prisoner.prisonerNumber,
      lastName: prisoner.lastName,
      firstName: prisoner.firstName,
      dateOfBirth: prisoner.dateOfBirth,
      prisonName: prisoner.prisonName,
      cellLocation: prisoner.cellLocation,
      hasPrimaryAddress,
    }
  }
}

export default populatePrisonerDetailsIfInCaseload
