import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { SelectRelationshipSchema } from './selectRelationshipSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class SelectRelationshipController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_CONTACT_RELATIONSHIP

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const relationshipOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.RELATIONSHIP, user)
      .then(val =>
        this.getSelectedRelationshipOptions(
          val,
          res.locals?.formResponses?.relationship ?? journey?.relationship?.type,
        ),
      )
    const viewModel = {
      journey,
      relationshipOptions,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/selectRelationship', viewModel)
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
    journey.relationship.type = relationship
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
