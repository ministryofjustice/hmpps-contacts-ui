import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import { components } from '../../../../../@types/contactsApi'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'

type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']

export default class ManageContactEditEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_EMAIL_ADDRESSES_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactEmailId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const email: ContactEmailDetails = contact.emailAddresses.find(
      (emailAddress: ContactEmailDetails) => emailAddress.contactEmailId === parseInt(contactEmailId, 10),
    )
    if (!email) {
      throw new Error(
        `Couldn't find email with id ${contactEmailId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = { backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId) }
    const viewModel = {
      emailAddress: res.locals?.formResponses?.['emailAddress'] ?? email.emailAddress,
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/addEditEmail', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; contactEmailId: string },
      unknown,
      EmailSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactEmailId } = req.params
    const { emailAddress } = req.body
    const request: UpdateEmailRequest = {
      emailAddress,
      updatedBy: user.name,
    }
    await this.contactsService.updateContactEmail(parseInt(contactId, 10), parseInt(contactEmailId, 10), request, user)
    await this.contactsService
      .getContact(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
