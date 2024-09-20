import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ManageContactsJourney = journeys.ManageContactsJourney

export default class ListContactsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; journeyId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { journeyId, prisonerNumber } = req.params

    let journey: ManageContactsJourney
    if (journeyId) {
      journey = req.session.manageContactsJourneys[journeyId]
      journey.prisoner = {
        firstName: prisonerDetails?.firstName,
        lastName: prisonerDetails?.lastName,
        prisonerNumber: prisonerDetails?.prisonerNumber,
        dateOfBirth: prisonerDetails?.dateOfBirth,
        prisonName: prisonerDetails?.prisonName,
      }
    }

    const activeContacts = await this.contactsService.getPrisonerContacts(prisonerNumber as string, true, user)
    const inactiveContacts = await this.contactsService.getPrisonerContacts(prisonerNumber as string, false, user)

    res.render('pages/contacts/manage/listContacts', {
      activeContacts,
      inactiveContacts,
      journey,
      prisonerNumber,
    })
  }
}
