import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'

export default class ManageRelationshipStatusController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE

  GET = async (req: Request<{ contactId?: string; prisonerContactId?: string }>, res: Response): Promise<void> => {
    const { contactId, prisonerContactId } = req.params
    const { user, journey } = res.locals

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    return res.render('pages/contacts/manage/contactDetails/manageRelationshipStatus', {
      contact,
      prisonerContactId,
      relationship,
      navigation,
    })
  }

  POST = async (
    req: Request<{ contactId: string; prisonerNumber: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { prisonerContactId } = req.params
    const request: UpdateRelationshipRequest = {
      isRelationshipActive: req.body.isRelationshipActive === 'YES',
      updatedBy: user.username,
    }

    await this.contactsService.updateContactRelationshipById(Number(prisonerContactId), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
