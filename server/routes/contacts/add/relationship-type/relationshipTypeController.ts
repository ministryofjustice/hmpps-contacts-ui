import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { RelationshipTypeSchema } from './relationshipTypeSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class RelationshipTypeController implements PageHandler {
  public PAGE_NAME = Page.SELECT_RELATIONSHIP_TYPE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const view = {
      isNewContact: true,
      journey,
      relationshipType:
        res.locals?.formResponses?.['relationshipType'] ??
        journey?.relationship?.pendingNewRelationshipType ??
        journey?.relationship?.relationshipType,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/add/relationshipType', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, RelationshipTypeSchema>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const { body } = req
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.pendingNewRelationshipType = body.relationshipType
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
