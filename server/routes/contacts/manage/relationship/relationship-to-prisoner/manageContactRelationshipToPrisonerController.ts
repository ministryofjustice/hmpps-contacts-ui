import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { ContactsService } from '../../../../../services'
import { SelectRelationshipSchema } from '../../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../../common/navigation'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactNames = journeys.ContactNames
import PatchRelationshipRequest = contactsApiClientTypes.PatchRelationshipRequest
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'

export default class ManageContactRelationshipToPrisonerController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_RELATIONSHIP_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContactName(Number(contactId), user)
    const relationship: PrisonerContactRelationshipDetails = await this.contactsService.getPrisonerContactRelationship(
      Number(prisonerContactId),
      user,
    )

    const names: ContactNames = {
      title: contact.titleDescription,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const currentRelationship = res.locals?.formResponses?.['relationship'] ?? relationship.relationshipToPrisonerCode

    const groupCodeForRelationshipType =
      relationship.relationshipTypeCode === 'S'
        ? ReferenceCodeType.SOCIAL_RELATIONSHIP
        : ReferenceCodeType.OFFICIAL_RELATIONSHIP
    const relationshipOptions = await this.referenceDataService.getReferenceData(groupCodeForRelationshipType, user)

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      navigation,
      relationshipOptions,
      relationshipType: relationship.relationshipTypeCode,
      relationship: currentRelationship,
      names,
      caption: 'Edit contact relationship information',
      continueButtonLabel: 'Confirm and save',
      noNullishSelectOption: true,
    }
    res.render('pages/contacts/manage/contactDetails/relationship/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      SelectRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { relationship } = req.body
    const request: PatchRelationshipRequest = {
      relationshipToPrisonerCode: relationship,
      updatedBy: user.username,
    }
    await this.contactsService
      .updateContactRelationshipById(Number(prisonerContactId), request, user)
      .then(_ => this.contactsService.getContactName(Number(contactId), user))
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails, { excludeMiddleNames: true })}.`,
        ),
      )

    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
