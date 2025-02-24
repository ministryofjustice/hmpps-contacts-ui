import { Request, Response } from 'express'
import { Page } from '../../../../../../services/auditService'
import { PageHandler } from '../../../../../../interfaces/pageHandler'
import { RelationshipTypeSchema } from '../../../../add/relationship-type/relationshipTypeSchema'
import Urls from '../../../../../urls'
import { Navigation } from '../../../../common/navigation'

export default class ChangeRelationshipTypeController implements PageHandler {
  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_SELECT_NEW_TYPE_PAGE

  GET = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const view = {
      journey,
      caption: 'Edit contact relationship information',
      relationshipType: res.locals?.formResponses?.['relationshipType'] ?? journey?.relationshipType,
      navigation,
    }
    res.render('pages/contacts/add/relationshipType', view)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string },
      unknown,
      RelationshipTypeSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    const { body } = req
    journey.relationshipType = body.relationshipType
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-to-prisoner/${journeyId}`,
    )
  }
}
