import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { ContactDetails, ContactEmailDetails, UpdateEmailRequest } from '../../../../../@types/contactsApiClient'

export default class ManageContactEditEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_EMAIL_ADDRESSES_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactEmailId } = req.params
    const id = Number(contactEmailId)
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const email = contact.emailAddresses.find((emailAddress: ContactEmailDetails) => emailAddress.contactEmailId === id)
    if (!email) {
      throw new Error(
        `Couldn't find email with id ${contactEmailId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const otherEmailAddresses = contact.emailAddresses //
      .filter((other: ContactEmailDetails) => other.contactEmailId !== id)
      .map((other: ContactEmailDetails) => other.emailAddress)

    const viewModel = {
      emailAddress: res.locals?.formResponses?.['emailAddress'] ?? email.emailAddress,
      otherEmailAddresses,
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/editEmail', viewModel)
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
    }
    await this.contactsService
      .updateContactEmail(Number(contactId), Number(contactEmailId), request, user, req.id)
      .then(() => this.contactsService.getContactName(Number(contactId), user))
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
