import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { EnterRelationshipCommentsSchemas } from './enterRelationshipCommentsSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'

export default class EnterRelationshipCommentsController implements PageHandler {
  public PAGE_NAME = Page.ENTER_RELATIONSHIP_COMMENTS

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const view = {
      journey,
      isUpdateJourney: false,
      names: journey.names,
      comments: res.locals?.formResponses?.['comments'] ?? journey?.relationship?.comments,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/contactDetails/relationship/relationshipComments', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, EnterRelationshipCommentsSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { body } = req
    journey.relationship!.comments = body.comments
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
