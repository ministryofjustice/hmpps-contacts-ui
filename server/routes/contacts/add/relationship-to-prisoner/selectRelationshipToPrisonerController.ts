import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import captionForAddContactJourney from '../addContactsUtils'

export default class SelectRelationshipToPrisonerController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_CONTACT_RELATIONSHIP

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const groupCodeForRelationshipType =
      journey.relationship.relationshipType === 'S'
        ? ReferenceCodeType.SOCIAL_RELATIONSHIP
        : ReferenceCodeType.OFFICIAL_RELATIONSHIP
    const relationshipOptions = await this.referenceDataService
      .getReferenceData(groupCodeForRelationshipType, user)
      .then(val =>
        this.getSelectedRelationshipOptions(
          val,
          res.locals?.formResponses?.relationship ?? journey?.relationship?.relationshipToPrisoner,
        ),
      )
    const viewModel = {
      journey,
      caption: captionForAddContactJourney(journey),
      relationshipOptions,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/common/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, SelectRelationshipSchema>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { relationship } = req.body
    const journey = req.session.addContactJourneys[journeyId]
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.relationshipToPrisoner = relationship
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }

  private getSelectedRelationshipOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options
      .map((relationship: ReferenceCode) => {
        return {
          text: relationship.description,
          value: relationship.code,
          selected: relationship.code === selected,
        }
      })
      .sort((a, b) => a.text.localeCompare(b.text))
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
