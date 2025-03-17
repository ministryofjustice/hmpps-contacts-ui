import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import Urls from '../../../urls'

export default class EditContactMethodsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.EDIT_CONTACT_METHODS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const navigation: Navigation = {
      backLink: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId, 'contact-methods'),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    return res.render('pages/contacts/manage/contactDetails/details/editContactMethods', {
      contact,
      prisonerNumber,
      contactId,
      prisonerContactId,
      navigation,
    })
  }
}
