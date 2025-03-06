import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import { components } from '../../../../../@types/contactsApi'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'

type CreateEmailRequest = components['schemas']['CreateEmailRequest']
export default class ManageContactAddEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      emailAddress: res.locals?.formResponses?.['emailAddress'],
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/editEmail', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, EmailSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { emailAddress } = req.body
    const request: CreateEmailRequest = {
      emailAddress,
      createdBy: user.name,
    }
    await this.contactsService.createContactEmail(parseInt(contactId, 10), request, user)
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
