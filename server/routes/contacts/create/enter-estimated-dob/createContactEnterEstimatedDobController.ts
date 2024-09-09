import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterEstimatedDobSchemas } from './createContactEnterEstimatedDobSchemas'

export default class CreateContactEnterEstimatedDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      isOverEighteen: res.locals?.formResponses?.isOverEighteen ?? journey?.dateOfBirth?.isOverEighteen,
    }
    res.render('pages/contacts/create/enterEstimatedDob', view)
  }

  POST = async (
    req: Request<{ journeyId: string }, unknown, CreateContactEnterEstimatedDobSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    journey.dateOfBirth.isOverEighteen = body.isOverEighteen
    res.redirect(`/contacts/create/check-answers/${journeyId}`)
  }
}
