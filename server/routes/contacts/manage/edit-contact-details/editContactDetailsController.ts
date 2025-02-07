import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

export default class EditContactDetailsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.EDIT_CONTACT_DETAILS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user, journey } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = { backLink: journey.returnPoint.url, cancelButton: journey.returnPoint.url }

    return res.render('pages/contacts/manage/contactDetails/details/editContactDetails', {
      contact,
      prisonerContactRelationship,
      prisonerNumber,
      contactId,
      prisonerContactId,
      manageContactRelationshipUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
      navigation,
    })
  }
}
