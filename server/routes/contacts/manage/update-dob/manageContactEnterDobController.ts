import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Navigation } from '../../common/navigation'
import { ContactsService } from '../../../../services'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import { UpdateDobSchemaType } from './manageContactDobSchema'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'

export default class ManageContactEnterDobController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_ENTER_DOB_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const contact = await this.contactsService.getContact(Number(contactId), user)

    let dateOfBirth
    // Only set from the contact if the form has not been submitted and returned with an error.
    if (!res.locals?.formResponses && contact.dateOfBirth) {
      const date = new Date(contact.dateOfBirth)
      dateOfBirth = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    }

    const view = {
      isOptional: false,
      caption: 'Edit contact details',
      continueButtonLabel: 'Confirm and save',
      contact,
      day: res.locals?.formResponses?.['day'] ?? dateOfBirth?.day,
      month: res.locals?.formResponses?.['month'] ?? dateOfBirth?.month,
      year: res.locals?.formResponses?.['year'] ?? dateOfBirth?.year,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/manageDob', view)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      UpdateDobSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { day, month, year } = req.body
    const request: PatchContactRequest = {
      dateOfBirth: new Date(`${year}-${month}-${day}Z`),
      updatedBy: user.username,
    }
    await this.contactsService.updateContactById(Number(contactId), request, user)
    await this.contactsService
      .getContact(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
