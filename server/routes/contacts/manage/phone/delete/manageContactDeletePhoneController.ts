import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { ContactDetails, ContactPhoneDetails } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactDeletePhoneController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactPhoneId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, contactPhoneId, prisonerContactId } = req.params
    const contactIdNumber = Number(contactId)
    const contactPhoneIdNumber = Number(contactPhoneId)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const phone = contact.phoneNumbers.find(
      (aPhone: ContactPhoneDetails) => aPhone.contactPhoneId === contactPhoneIdNumber,
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactPhoneId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    res.render('pages/contacts/manage/contactMethods/confirmDeletePhone', { contact, phone, navigation })
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactPhoneId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactPhoneId } = req.params
    const contactIdNumber = Number(contactId)
    const contactPhoneIdNumber = Number(contactPhoneId)

    await this.contactsService.deleteContactPhone(contactIdNumber, contactPhoneIdNumber, user, req.id)
    await this.contactsService
      .getContact(contactIdNumber, user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
