import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { nextPageForAddContactJourney } from '../addContactFlowControl'
import { AddContactJourney, ReturnPoint } from '../../../../@types/journeys'

export default class StartAddContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (req: Request<{ prisonerNumber: string }>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const returnPoint: ReturnPoint = { url: `/prisoner/${prisonerNumber}/contacts/list` }
    const journey: AddContactJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      isCheckingAnswers: false,
      returnPoint,
      prisonerNumber,
    }
    if (!req.session.addContactJourneys) {
      req.session.addContactJourneys = {}
    }
    req.session.addContactJourneys[journey.id] = journey
    if (Object.entries(req.session.addContactJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.addContactJourneys)
        .sort(
          (a: AddContactJourney, b: AddContactJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.addContactJourneys![journeyToRemove.id])
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
