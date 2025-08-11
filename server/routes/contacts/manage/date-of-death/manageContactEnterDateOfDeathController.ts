import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Navigation } from '../../common/navigation'
import { ContactsService } from '../../../../services'
import { DateOfDeathSchemaType } from './manageContactDateOfDeathSchema'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import { PatchContactRequest } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

export default class ManageContactEnterDateOfDeathController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_ENTER_DATE_OF_DEATH_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { backTo } = req.query
    const navigation: Navigation = {
      backLink:
        backTo && backTo === 'contact-details'
          ? Urls.contactDetails(prisonerNumber, contactId, prisonerContactId)
          : Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const contact = await this.contactsService.getContact(Number(contactId), user)

    let deceasedDate
    // Only set from the contact if the form has not been submitted and returned with an error.
    if (!res.locals?.formResponses && contact.deceasedDate) {
      const date = new Date(contact.deceasedDate)
      deceasedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    }

    const view = {
      contact,
      day: res.locals?.formResponses?.['day'] ?? deceasedDate?.day,
      month: res.locals?.formResponses?.['month'] ?? deceasedDate?.month,
      year: res.locals?.formResponses?.['year'] ?? deceasedDate?.year,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/manageDeceasedDate', view)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      DateOfDeathSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { day, month, year } = req.body
    const request: PatchContactRequest = {
      deceasedDate: new Date(`${year}-${month}-${day}Z`).toISOString(),
    }
    await this.contactsService
      .updateContactById(Number(contactId), request, user, req.id)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
