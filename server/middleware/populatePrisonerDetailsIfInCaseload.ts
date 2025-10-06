import { Request, Response, NextFunction } from 'express'
import { PrisonerSearchService, ContactsService } from '../services'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { PrisonerDetails } from '../@types/journeys'
import { PagedModelPrisonerRestrictionDetails } from '../@types/contactsApiClient'

const populatePrisonerDetailsIfInCaseload = (
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
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
        try {
          const restrictions: PagedModelPrisonerRestrictionDetails = await contactsService.getPrisonerRestrictions(
            prisonerNumber,
            0,
            10,
            user,
            true,
          )
          restrictionsCount = restrictions?.content?.length ?? 0
        } catch (err) {
          // swallow restriction service errors and continue (count stays 0)
        }

        res.locals.prisonerDetails = toPrisonerDetails(prisoner, restrictionsCount)
      }
    } catch (err) {
      // swallow prisoner lookup errors and continue (don't set prisonerDetails)
      next(err)
    } finally {
      // ensure next is always called
      next()
    }
  }

  function toPrisonerDetails(prisoner: Prisoner, restrictionsCount: number): PrisonerDetails {
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
      alertsCount: prisoner.alerts?.length ?? 0,
      restrictionsCount,
      hasPrimaryAddress,
    }
  }
}

export default populatePrisonerDetailsIfInCaseload
