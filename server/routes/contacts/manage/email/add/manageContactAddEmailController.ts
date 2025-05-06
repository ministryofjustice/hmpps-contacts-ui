import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailsSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import {
  ContactDetails,
  ContactEmailDetails,
  CreateMultipleEmailsRequest,
  EmailAddress,
} from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactAddEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const otherEmailAddresses = contact.emailAddresses?.map((other: ContactEmailDetails) => other.emailAddress) ?? []

    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const viewModel = {
      emails: res.locals?.formResponses?.['emails'] ?? [{ emailAddress: '' }],
      names: contact,
      otherEmailAddresses,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/addEmails', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, EmailsSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { emails, save, add, remove } = req.body
    if (typeof save !== 'undefined' && emails) {
      const request: CreateMultipleEmailsRequest = {
        emailAddresses: emails.map(email => ({ emailAddress: email.emailAddress }) as EmailAddress),
      }
      await this.contactsService
        .createContactEmails(parseInt(contactId, 10), request, user, req.id)
        .then(_ => this.contactsService.getContactName(Number(contactId), user))
        .then(response =>
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
          ),
        )
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } else {
      if (typeof add !== 'undefined') {
        emails.push({ emailAddress: '' })
      } else if (typeof remove !== 'undefined') {
        emails.splice(Number(remove), 1)
      }
      // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
      // possibility if JS is disabled after a page load or the user somehow removes all emails.
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
      )
    }
  }
}
