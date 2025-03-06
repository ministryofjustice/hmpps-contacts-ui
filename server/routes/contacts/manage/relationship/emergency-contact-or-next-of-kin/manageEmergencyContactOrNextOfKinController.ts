import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ManageEmergencyContactOrNextOfKinSchemaType } from './manageEmergencyContactOrNextOfKinSchema'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PatchRelationshipRequest = contactsApiClientTypes.PatchRelationshipRequest

export default class ManageEmergencyContactOrNextOfKinController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMERGENCY_CONTACT_OR_NEXT_OF_KIN_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      isOptional: false,
      caption: 'Edit contact relationship information',
      continueButtonLabel: 'Confirm and save',
      contact,
      prisonerContactId,
      emergencyContact: relationship.isEmergencyContact,
      nextOfKin: relationship.isNextOfKin,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/relationship/manageNextOfKinAndEmergencyContact', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      ManageEmergencyContactOrNextOfKinSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchRelationshipRequest = {
      isEmergencyContact: req.body.emergencyContact,
      isNextOfKin: req.body.nextOfKin,
      updatedBy: user.username,
    }
    await this.contactsService.updateContactRelationshipById(parseInt(prisonerContactId, 10), request, user)
    await this.contactsService.getContactName(Number(contactId), user).then(response => {
      req.flash(
        FLASH_KEY__SUCCESS_BANNER,
        `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails, { excludeMiddleNames: true })}.`,
      )
    })
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
