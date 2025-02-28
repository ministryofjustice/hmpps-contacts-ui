import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { EnterRelationshipCommentsSchemas } from '../../../add/relationship-comments/enterRelationshipCommentsSchemas'
import PatchRelationshipRequest = contactsApiClientTypes.PatchRelationshipRequest
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageRelationshipCommentsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE

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
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    return res.render('pages/contacts/manage/contactDetails/manageRelationshipComments', {
      isOptional: false,
      caption: 'Edit contact relationship information',
      continueButtonLabel: 'Confirm and save',
      contact,
      prisonerContactId,
      navigation,
      comments: res.locals.formResponses?.['comments'] ?? relationship.comments,
    })
  }

  POST = async (
    req: Request<
      { contactId: string; prisonerNumber: string; prisonerContactId: string },
      unknown,
      EnterRelationshipCommentsSchemas
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchRelationshipRequest = {
      comments: req.body.comments ?? null,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactRelationshipById(Number(prisonerContactId), request, user)
    await this.contactsService.getContact(Number(contactId), user).then(response => {
      req.flash(
        FLASH_KEY__SUCCESS_BANNER,
        `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails, { excludeMiddleNames: true })}.`,
      )
    })
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
