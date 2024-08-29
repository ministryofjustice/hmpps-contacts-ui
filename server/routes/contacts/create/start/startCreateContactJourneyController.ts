import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CreateContactJourney = journeys.CreateContactJourney

export default class StartCreateContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_START_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const journey: CreateContactJourney = { id: uuidv4() }
    if (!req.session.createContactJourneys) {
      req.session.createContactJourneys = {}
    }
    req.session.createContactJourneys[journey.id] = journey
    res.redirect(`/contacts/create/enter-name/${journey.id}`)
  }
}
