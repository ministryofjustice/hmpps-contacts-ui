import { Request, Response, NextFunction } from 'express'
import { PrisonerSearchService, ContactsService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { PrisonerDetails } from '../@types/journeys'
import { PagedModelPrisonerRestrictionDetails } from '../@types/contactsApiClient'
import logger from '../../logger'
import { PageAlert } from '../data/alertsApiTypes'
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

    try {
      // get prisoner first - if prisoner lookup fails we won't attempt restrictions
      const prisoner: Prisoner | undefined = await prisonerSearchService.getByPrisonerNumber(prisonerNumber, user)

      if (prisoner) {
        // fetch restrictions count safely
        let restrictionsCount = 0
        let alertsCount = 0
        try {
          const restrictions: PagedModelPrisonerRestrictionDetails = await contactsService.getPrisonerRestrictions(
            prisonerNumber,
            0,
            10,
            user,
            false,
            false,
          )
          restrictionsCount = restrictions?.content?.length ?? 0

          const prisonerAlertsContent: PageAlert = await alertsService.getAlerts(prisonerNumber, user)
          alertsCount = prisonerAlertsContent?.content?.length ?? 0
        } catch (err) {
          // do nothing if restrictions fetch fails - we can still show prisoner details
          logger.error(err, `Failed to populate alerts and restrictions for prisoner: ${req.params.prisonerNumber}`)
        }

        res.locals.prisonerDetails = toPrisonerDetails(prisoner, restrictionsCount, alertsCount)
      }
    } catch (err) {
      logger.error(err, `Failed to populate prisoner details for prisoner: ${req.params.prisonerNumber}`)
      next(err)
    } finally {
      next()
    }
  }

  function toPrisonerDetails(prisoner: Prisoner, restrictionsCount: number, alertsCount: number): PrisonerDetails {
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
