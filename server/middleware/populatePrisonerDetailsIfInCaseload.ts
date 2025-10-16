import { Request } from 'express'
import { PrisonerSearchService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from './asyncMiddleware'
import { PrisonerDetails } from '../@types/journeys'

const populatePrisonerDetailsIfInCaseload = (prisonerSearchService: PrisonerSearchService) => {
  return asyncMiddleware(async (req: Request<{ prisonerNumber: string }>, res, next) => {
    const { prisonerNumber } = req.params
    const { user } = res.locals
    return prisonerSearchService.getByPrisonerNumber(prisonerNumber, user).then((prisoner: Prisoner) => {
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
