import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import Urls from '../../../urls'
import { ContactDetails, PrisonerContactRelationshipDetails } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

export default class EditContactDetailsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.EDIT_CONTACT_DETAILS_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)

    const contactDetailsUrl = Urls.contactDetails(prisonerNumber, contactId, prisonerContactId)
    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: contactDetailsUrl,
      cancelButton: contactDetailsUrl,
    }

    return res.render('pages/contacts/manage/contactDetails/details/editContactDetails', {
      contact,
      prisonerContactRelationship,
      prisonerNumber,
      contactId,
      prisonerContactId,
      navigation,
    })
  }
}
