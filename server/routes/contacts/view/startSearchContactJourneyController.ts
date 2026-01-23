import e, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import Permission from '../../../enumeration/permission'
import { SearchContactJourney } from '../../../@types/journeys'

export default class StartSearchContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CONTACT_SEARCH_START_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      {
        contactId: string
        prisonerContactId: string
      },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const journey = this.setSessionData(req)
    res.redirect(`/direct/contacts/search/${journey.id}`)
  }

  private setSessionData(req: e.Request) {
    const journey = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      contact: {},
    }
    if (!req.session.searchContactJourneys) {
      req.session.searchContactJourneys = {}
    }
    req.session.searchContactJourneys[journey.id] = journey
    if (Object.entries(req.session.searchContactJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.searchContactJourneys)
        .sort(
          (a: SearchContactJourney, b: SearchContactJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.searchContactJourneys![journeyToRemove.id])
    }
    return journey
  }
}
