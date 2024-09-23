import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterEstimatedDobSchemas } from './createContactEnterEstimatedDobSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class CreateContactEnterEstimatedDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      isOverEighteen: res.locals?.formResponses?.isOverEighteen ?? journey?.dateOfBirth?.isOverEighteen,
    }
    res.render('pages/contacts/add/enterEstimatedDob', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, CreateContactEnterEstimatedDobSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    journey.dateOfBirth.isOverEighteen = body.isOverEighteen
    if (journey.isCheckingAnswers) {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
    }
  }
}
