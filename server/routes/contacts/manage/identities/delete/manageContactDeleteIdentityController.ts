import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ContactDetails, ContactIdentityDetails } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactDeleteIdentityController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_IDENTITY_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactIdentityId } = req.params
    const contactIdNumber = parseInt(contactId, 10)
    const contactIdentityNumber = parseInt(contactIdentityId, 10)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const identityDocument = contact.identities.find(
      (aIdentityNumber: ContactIdentityDetails) => aIdentityNumber.contactIdentityId === contactIdentityNumber,
    )
    if (!identityDocument) {
      throw new Error(
        `Couldn't find identity document with id ${contactIdentityId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    res.render('pages/contacts/manage/contactDetails/confirmDeleteIdentity', {
      caption: 'Edit identity documentation for a contact',
      contact,
      identityDocument,
      navigation,
    })
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactIdentityId } = req.params
    const contactIdNumber = Number(contactId)
    const contactIdentityNumber = Number(contactIdentityId)

    await this.contactsService.deleteContactIdentity(contactIdNumber, contactIdentityNumber, user, req.id)
    await this.contactsService
      .getContact(contactIdNumber, user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the identity documentation for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
