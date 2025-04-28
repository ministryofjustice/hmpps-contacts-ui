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

export default class ChangeRelationshipTypeRelationshipToPrisonerController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE

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

    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-type/${journey.id}`,
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
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    const request: PatchRelationshipRequest = {
      relationshipTypeCode: journey.relationshipType,
      relationshipToPrisonerCode: relationship,
    }
    await this.contactsService
      .updateContactRelationshipById(Number(prisonerContactId), request, user, req.id)
      .then(_ => this.contactsService.getContactName(Number(contactId), user))
      .then(response => {
        delete req.session.changeRelationshipTypeJourneys![journeyId]
        return req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails!, { excludeMiddleNames: true })}.`,
        )
      })

    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
