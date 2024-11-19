import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import Contact = contactsApiClientTypes.Contact
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import { Navigation } from '../../add/addContactFlowControl'

export default class ManageRelationshipCommentsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE

  GET = async (req: Request<{ contactId?: string; prisonerContactId?: string }>, res: Response): Promise<void> => {
    const { contactId, prisonerContactId } = req.params
    const { prisonerDetails, user, journey } = res.locals
    const navigation: Navigation = { backLink: journey.returnPoint.url }

    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)

    journey.names = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    return res.render('pages/contacts/common/enterRelationshipComments', {
      journey,
      prisonerContactId,
      navigation,
      prisonerDetails,
      continueButtonLabel: 'Save and continue',
      comments: relationship.comments,
    })
  }

  POST = async (
    req: Request<{ contactId: string; prisonerNumber: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerNumber, prisonerContactId } = req.params
    const request: UpdateRelationshipRequest = {
      comments: req.body.comments,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactRelationshipById(
      parseInt(contactId, 10),
      Number(prisonerContactId),
      request,
      user,
    )

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)
  }
}
