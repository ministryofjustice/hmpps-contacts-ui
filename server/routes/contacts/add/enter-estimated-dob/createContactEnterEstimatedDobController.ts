import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { EnterEstimatedDobSchemas } from '../../common/enter-estimated-dob/enterEstimatedDobSchemas'

export default class CreateContactEnterEstimatedDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const view = {
      journey,
      isOverEighteen: res.locals?.formResponses?.isOverEighteen ?? journey?.dateOfBirth?.isOverEighteen,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
      continueButtonLabel: 'Continue',
    }
    res.render('pages/contacts/common/enterEstimatedDob', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, EnterEstimatedDobSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const { body } = req
    journey.dateOfBirth.isOverEighteen = body.isOverEighteen
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
