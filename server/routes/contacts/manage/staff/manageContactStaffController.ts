import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'
import Urls from '../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import { ManageContactStaffSchemaType } from './manageContactStaffSchema'

export default class ManageContactStaffController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      caption: 'Edit contact details',
      continueButtonLabel: 'Confirm and save',
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/manageStaff', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      ManageContactStaffSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchContactRequest = {
      isStaff: req.body.isStaff === 'YES',
      updatedBy: user.username,
    }
    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
