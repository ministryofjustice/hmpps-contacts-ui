import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageApprovedToVisitController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_APPROVED_TO_VISIT_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      contact,
      relationship,
      navigation,
    }
    res.render('pages/contacts/manage/updateApprovedToVisit', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { prisonerContactId } = req.params
    const request: PatchContactRequest = {
      isApprovedVisitor: req.body.isApprovedToVisit === 'YES',
      updatedBy: user.username,
    }
    await this.contactsService.updateContactRelationshipById(parseInt(prisonerContactId, 10), request, user)
    res.redirect(journey.returnPoint.url)
  }
}
