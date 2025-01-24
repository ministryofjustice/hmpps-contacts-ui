import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class ManageRelationshipCommentsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { contactId, prisonerContactId } = req.params
    const { prisonerDetails, user, journey } = res.locals
    const navigation: Navigation = { backLink: journey.returnPoint.url }

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)

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
    const { user, journey } = res.locals
    const { prisonerContactId } = req.params
    const request: UpdateRelationshipRequest = {
      comments: req.body.comments,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactRelationshipById(Number(prisonerContactId), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
