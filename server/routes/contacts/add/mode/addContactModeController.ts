import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { nextPageForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class AddContactModeController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_MODE_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { mode?: 'EXISTING' | 'NEW' }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, mode } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    journey.mode = mode
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
