import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../services/referenceDataService'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class SelectRelationshipToPrisonerController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_CONTACT_RELATIONSHIP

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const relationshipType = journey.relationship!.pendingNewRelationshipType ?? journey.relationship!.relationshipType
    const groupCodeForRelationshipType =
      relationshipType! === 'S' ? ReferenceCodeType.SOCIAL_RELATIONSHIP : ReferenceCodeType.OFFICIAL_RELATIONSHIP

    const relationshipOptions = await this.referenceDataService.getReferenceData(groupCodeForRelationshipType, user)
    const viewModel = {
      isNewContact: true,
      names: journey.names,
      relationship: res.locals?.formResponses?.['relationship'] ?? journey?.relationship?.relationshipToPrisoner,
      relationshipType,
      relationshipOptions,
      journey,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
      continueButtonLabel: 'Continue',
    }
    res.render('pages/contacts/manage/contactDetails/relationship/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, SelectRelationshipSchema>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { relationship } = req.body
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.relationshipToPrisoner = relationship
    journey.relationship.relationshipType = (journey.relationship.pendingNewRelationshipType ??
      journey.relationship.relationshipType)!
    delete journey.relationship.pendingNewRelationshipType
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
