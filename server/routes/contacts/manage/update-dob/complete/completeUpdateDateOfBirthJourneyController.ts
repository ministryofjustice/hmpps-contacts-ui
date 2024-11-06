import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

export default class CompleteUpdateDateOfBirthJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_COMPLETE_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.updateDateOfBirthJourneys[journeyId]
    let dateOfBirth: Date = null
    let isOverEighteen = null
    if (journey.dateOfBirth.isKnown === 'YES') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    } else {
      switch (journey.dateOfBirth.isOverEighteen) {
        case 'YES':
          isOverEighteen = 'YES'
          break
        case 'NO':
          isOverEighteen = 'NO'
          break
        case 'DO_NOT_KNOW':
          isOverEighteen = 'DO_NOT_KNOW'
          break
        default:
          isOverEighteen = null
      }
    }
    const request: PatchContactRequest = {
      dateOfBirth,
      estimatedIsOverEighteen: isOverEighteen,
      updatedBy: user.username,
    }
    await this.contactService.updateContactById(journey.contactId, request, user)
    res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}`)
  }
}
