import { Request, Response } from 'express'
import { Page } from '../../../../../../services/auditService'
import { PageHandler } from '../../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../../services/referenceDataService'
import { ContactsService } from '../../../../../../services'
import { SelectRelationshipSchema } from '../../../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../../../common/navigation'
import { formatNameFirstNameFirst } from '../../../../../../utils/formatName'
import Urls from '../../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../../middleware/setUpSuccessNotificationBanner'
import ReferenceCodeType from '../../../../../../enumeration/referenceCodeType'
import { PatchRelationshipRequest } from '../../../../../../@types/contactsApiClient'
import Permission from '../../../../../../enumeration/permission'

export default class ChangeRelationshipTypeRelationshipToPrisonerController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!

    const currentRelationship = res.locals?.formResponses?.['relationship'] ?? journey.relationshipToPrisoner

    const groupCodeForRelationshipType =
      journey.relationshipType === 'S' ? ReferenceCodeType.SOCIAL_RELATIONSHIP : ReferenceCodeType.OFFICIAL_RELATIONSHIP
    const relationshipOptions = await this.referenceDataService.getReferenceData(groupCodeForRelationshipType, user)

    let backLink = ''
    if (journey.mode === 'all') {
      backLink = `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-type/${journey.id}`
    } else if (journey.mode === 'relationship-to-prisoner') {
      backLink = Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId)
    }
    const navigation: Navigation = {
      backLink,
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      isNewContact: false,
      navigation,
      relationshipOptions,
      relationshipType: journey.relationshipType,
      relationship: currentRelationship,
      names: journey.names,
      continueButtonLabel: 'Confirm and save',
    }
    res.render('pages/contacts/manage/contactDetails/relationship/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        journeyId: string
      },
      unknown,
      SelectRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { relationship } = req.body

    // Set on session in case it's a duplicate and we need to use the value on the handle duplicate page
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    journey.relationshipToPrisoner = relationship

    const request: PatchRelationshipRequest = {
      relationshipToPrisonerCode: journey.relationshipToPrisoner,
    }
    if (journey.mode === 'all') {
      request.relationshipTypeCode = journey.relationshipType
    }

    const { success, error } = await this.contactsService
      .updateContactRelationshipById(Number(prisonerContactId), request, user, req.id)
      .then(
        _ => {
          return { success: true, error: null }
        },
        reason => {
          return { success: false, error: reason }
        },
      )

    if (success) {
      await this.contactsService.getContactName(Number(contactId), user).then(response => {
        delete req.session.changeRelationshipTypeJourneys![journeyId]
        return req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails!, { excludeMiddleNames: true })}.`,
        )
      })
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } else if (error.status === 409) {
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/handle-duplicate/${journey.id}`,
      )
    } else {
      throw error
    }
  }
}
