import { NextFunction, Request, Response } from 'express'
import { PrisonerSearchService, ContactsService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { PrisonerDetails } from '../@types/journeys'
import AlertsService from '../services/alertsService'

const populatePrisonerDetailsIfInCaseload = (
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
  alertsService: AlertsService,
) => {
  // return a plain async middleware so we can guarantee next() is invoked
  return async (req: Request<{ prisonerNumber: string }>, res: Response, next: NextFunction): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    // get prisoner first - if prisoner lookup fails we won't attempt restrictions
    const prisoner = await prisonerSearchService.getByPrisonerNumber(prisonerNumber, user)

    if (prisoner) {
      // get restrictions and alerts in parallel - then if either fails set count to null so template can render API failure message
      const [restrictionsPromise, alertsPromise] = await Promise.allSettled([
        contactsService.getPrisonerRestrictions(prisonerNumber, 0, 10, user, false, false),
        alertsService.getAlerts(prisonerNumber, user),
      ])

      const restrictionsCount =
        restrictionsPromise.status === 'fulfilled' ? (restrictionsPromise.value?.content?.length ?? 0) : null

      const alertsCount = alertsPromise.status === 'fulfilled' ? (alertsPromise.value?.content?.length ?? 0) : null

      res.locals.prisonerDetails = toPrisonerDetails(prisoner, restrictionsCount, alertsCount)
    }

    next()
  }

  function toPrisonerDetails(
    prisoner: Prisoner,
    restrictionsCount: number | null,
    alertsCount: number | null,
  ): PrisonerDetails {
    const hasPrimaryAddress = !!(
      prisoner.addresses &&
      prisoner.addresses.length > 0 &&
      prisoner.addresses.find(address => address.primaryAddress)
    )

    return {
      prisonerNumber: prisoner.prisonerNumber,
      lastName: prisoner.lastName,
      firstName: prisoner.firstName,
      dateOfBirth: prisoner.dateOfBirth,
      prisonName: prisoner.prisonName,
      cellLocation: prisoner.cellLocation,
      alertsCount,
      restrictionsCount,
      hasPrimaryAddress,
    }
  }
}

export default populatePrisonerDetailsIfInCaseload
