import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { RelationshipTypeSchema } from './relationshipTypeSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'

export default class RelationshipTypeController implements PageHandler {
  public PAGE_NAME = Page.SELECT_RELATIONSHIP_TYPE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
      relationshipType: res.locals?.formResponses?.relationshipType ?? journey?.relationship?.relationshipType,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/relationshipType', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, RelationshipTypeSchema>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const { body } = req
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.relationshipType = body.relationshipType
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
