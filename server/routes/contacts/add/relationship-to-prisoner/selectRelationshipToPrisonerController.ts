import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../services/referenceDataService'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import { relationshipToPrisonerOptionsForRelationshipType } from '../../../../utils/relationshipTypeUtils'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class SelectRelationshipToPrisonerController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_CONTACT_RELATIONSHIP

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const formattedName = formatNameFirstNameFirst(journey.names!)

    const { groupCodeForRelationshipType, hintText, defaultSelectLabel } =
      relationshipToPrisonerOptionsForRelationshipType(journey.relationship!.relationshipType!, formattedName)

    const relationshipOptions = await this.referenceDataService
      .getReferenceData(groupCodeForRelationshipType, user)
      .then(val =>
        this.getSelectedRelationshipOptions(
          val,
          res.locals?.formResponses?.['relationship'] ?? journey?.relationship?.relationshipToPrisoner,
          defaultSelectLabel,
        ),
      )
    const viewModel = {
      names: journey.names,
      hintText,
      caption: captionForAddContactJourney(journey),
      relationshipOptions,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
      continueButtonLabel: 'Continue',
    }
    res.render('pages/contacts/common/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, SelectRelationshipSchema>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { relationship } = req.body
    const journey = req.session.addContactJourneys![journeyId]!
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.relationshipToPrisoner = relationship
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }

  private getSelectedRelationshipOptions(
    options: ReferenceCode[],
    selected: string | null | undefined,
    defaultSelectLabel: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((relationship: ReferenceCode) => {
      return {
        text: relationship.description,
        value: relationship.code,
        selected: relationship.code === selected,
      }
    })
    return [{ text: defaultSelectLabel, value: '' }, ...mappedOptions]
  }
}
