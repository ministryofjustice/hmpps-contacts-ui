import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CreateContactJourney = journeys.CreateContactJourney

export default class StartCreateContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (req: Request, res: Response): Promise<void> => {
    const journey: CreateContactJourney = { id: uuidv4(), lastTouched: new Date(), isCheckingAnswers: false }
    if (!req.session.createContactJourneys) {
      req.session.createContactJourneys = {}
    }
    req.session.createContactJourneys[journey.id] = journey
    if (Object.entries(req.session.createContactJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.createContactJourneys)
        .sort((a: CreateContactJourney, b: CreateContactJourney) => b.lastTouched.getTime() - a.lastTouched.getTime())
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.createContactJourneys[journeyToRemove.id])
    }
    res.redirect(`/contacts/create/enter-name/${journey.id}`)
  }
}
