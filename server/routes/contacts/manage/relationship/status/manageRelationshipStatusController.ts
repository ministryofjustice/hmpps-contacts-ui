import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { ContactsService } from '../../../../../services'
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ManageRelationshipStatusSchemaType } from './manageRelationshipStatusSchema'

export default class ManageRelationshipStatusController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    return res.render('pages/contacts/manage/contactDetails/manageRelationshipStatus', {
      contact,
      prisonerContactId,
      isRelationshipActive: relationship.isRelationshipActive,
      navigation,
    })
  }

  POST = async (
    req: Request<
      { contactId: string; prisonerNumber: string; prisonerContactId: string },
      unknown,
      ManageRelationshipStatusSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: UpdateRelationshipRequest = {
      isRelationshipActive: req.body.relationshipStatus === 'YES',
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
