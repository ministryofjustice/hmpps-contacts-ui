import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Navigation } from '../../common/navigation'
import { ContactsService } from '../../../../services'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import { PatchContactRequest } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

export default class ManageContactDeleteDateOfDeathController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_CONFIRM_DELETE_DATE_OF_DEATH_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

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

    const view = {
      contact,
      dateOfDeath: contact.deceasedDate,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/confirmDeleteDeceasedDate', view)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const request: PatchContactRequest = {
      // @ts-expect-error mistyped by openapi script. this property can be set to null to unset its value.
      deceasedDate: null,
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
