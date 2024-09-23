import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { EnterRelationshipCommentsSchemas } from './enterRelationshipCommentsSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class EnterRelationshipCommentsController implements PageHandler {
  public PAGE_NAME = Page.ENTER_RELATIONSHIP_COMMENTS

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      comments: res.locals?.formResponses?.comments ?? journey?.relationship?.comments,
    }
    res.render('pages/contacts/add/enterRelationshipComments', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, EnterRelationshipCommentsSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    journey.relationship.comments = body.comments
    res.redirect(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
  }
}
