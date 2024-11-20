import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'

export default class ManageContactStaffController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/updateStaff', viewModel)
  }

  POST = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      isStaff: req.body.isStaff === 'YES',
      updatedBy: user.username,
    }
    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)
    res.redirect(journey.returnPoint.url)
  }
}
