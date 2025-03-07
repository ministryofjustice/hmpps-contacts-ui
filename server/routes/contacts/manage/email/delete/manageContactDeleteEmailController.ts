import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactEmailDetails = contactsApiClientTypes.ContactEmailDetails
import { Navigation } from '../../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'

export default class ManageContactDeleteEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_EMAIL_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactEmailId } = req.params
    const contactIdNumber = Number(contactId)
    const contactEmailIdNumber = Number(contactEmailId)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const email: ContactEmailDetails = contact.emailAddresses.find(
      (aEmail: ContactEmailDetails) => aEmail.contactEmailId === contactEmailIdNumber,
    )
    if (!email) {
      throw new Error(
        `Couldn't find email with id ${contactEmailId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId, 'contact-methods'),
    }
    res.render('pages/contacts/manage/contactMethods/confirmDeleteEmail', {
      caption: 'Edit contact methods',
      contact,
      email,
      navigation,
    })
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactEmailId } = req.params
    const contactIdNumber = Number(contactId)
    const contactEmailIdNumber = Number(contactEmailId)

    await this.contactsService.deleteContactEmail(contactIdNumber, contactEmailIdNumber, user)
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
