import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import ContactsService from '../../../../services/contactsService'

export default class ContactConfirmationController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails } = res.locals
    const journey = req.session.manageContactsJourneys[journeyId]

    res.render('pages/contacts/manage/contactConfirmation/confirmation', { prisonerDetails, journey })
  }
}
